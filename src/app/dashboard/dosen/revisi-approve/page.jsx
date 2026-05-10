'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, Clock, Users, FileText } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { dosenAPI } from '@/lib/api';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

const STATUS_LABEL = {
  pending: { label: 'Menunggu Review', color: 'ctp-yellow', Icon: Clock },
  approved: { label: 'Disetujui', color: 'ctp-green', Icon: CheckCircle2 },
  rejected: { label: 'Ditolak', color: 'ctp-red', Icon: XCircle },
  needs_revision: { label: 'Perlu Diperbaiki', color: 'ctp-peach', Icon: AlertTriangle },
};

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function DosenRevisiApprovePage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role && !['dosen', 'penguji', 'koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dosenAPI.getRevisiList();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReview = (item) => {
    setSelected(item);
    setReviewStatus(item?.status === 'pending' ? 'approved' : (item?.status || 'approved'));
    setReviewNote(item?.catatan_dosen || '');
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await dosenAPI.reviewRevisi(selected.id, {
        status: reviewStatus,
        catatan_dosen: reviewNote.trim() || undefined,
      });
      if (res.ok) {
        toast.success('Revisi berhasil di-review');
        setSelected(null);
        await loadData();
      } else {
        toast.error(res.error || 'Gagal review revisi');
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
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <ClipboardCheck className="h-4 w-4" /> Approve Revisi Sidang
          </CardTitle>
          <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
            Review revisi pasca sidang dari mahasiswa bimbingan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada revisi yang menunggu review.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((item) => {
                const st = STATUS_LABEL[item.status] || STATUS_LABEL.pending;
                const Icon = st.Icon;
                const isGroup = item.grouping_mode === 'kelompok';
                return (
                  <div key={item.id} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge className={`rounded-xl border bg-[hsl(var(--${st.color})/0.12)] text-[hsl(var(--${st.color}))] border-[hsl(var(--${st.color})/0.35)]`}>
                            <Icon className="h-3 w-3 mr-1" /> {st.label}
                          </Badge>
                          <span className="text-xs text-[hsl(var(--ctp-subtext0))]">Ronde {item.revision_round}</span>
                          <span className="text-xs text-[hsl(var(--ctp-subtext0))]">· {formatDateTime(item.submitted_at)}</span>
                          {isGroup ? (
                            <Badge className="rounded-xl border bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))] border-[hsl(var(--ctp-blue)/0.35)]">
                              <Users className="h-3 w-3 mr-1" /> Kelompok
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">
                          {isGroup ? (item.kelompok_nama || `Kelompok ${item.kelompok_id}`) : item.mahasiswa_nama}
                        </p>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{item.npm || '-'} · {item.judul_proyek || '-'}</p>
                        {isGroup && item.anggota_nama ? (
                          <p className="text-xs text-[hsl(var(--ctp-subtext1))] mt-1">Anggota: {item.anggota_nama}</p>
                        ) : null}
                        {item.catatan_mahasiswa ? (
                          <p className="text-sm mt-2 text-[hsl(var(--ctp-text))] whitespace-pre-line">{item.catatan_mahasiswa}</p>
                        ) : null}
                        {item.file_url ? (
                          <a href={item.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-[hsl(var(--ctp-blue))] hover:underline">
                            <FileText className="h-3 w-3" /> Lihat file revisi
                          </a>
                        ) : null}
                      </div>
                      <Button onClick={() => openReview(item)} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-lavender)/0.35)]">
                        Review
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardDialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }} title="Review Revisi">
        <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-3">Review Revisi Sidang</h3>
        {selected ? (
          <div className="space-y-3">
            <p className="text-sm text-[hsl(var(--ctp-subtext1))]">
              {selected.grouping_mode === 'kelompok'
                ? (selected.kelompok_nama || `Kelompok ${selected.kelompok_id}`)
                : selected.mahasiswa_nama}{' '}
              · Ronde {selected.revision_round}
            </p>
            <div>
              <Label className="text-[hsl(var(--ctp-subtext1))]">Status</Label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="needs_revision">Needs Revision</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[hsl(var(--ctp-subtext1))]">Catatan untuk Mahasiswa</Label>
              <Textarea rows={4} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Tuliskan catatan revisi atau alasan penolakan" className={inputCls} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" onClick={() => setSelected(null)} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]">
                {submitting ? 'Menyimpan...' : 'Simpan Review'}
              </Button>
            </div>
          </div>
        ) : null}
      </DashboardDialog>
    </motion.div>
  );
}
