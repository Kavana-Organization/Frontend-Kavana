'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardCheck, FileText, Users } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
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
import { dosenAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

const STATUS_LABEL = {
  pending: { label: 'Menunggu Review', statusKey: 'pending' },
  approved: { label: 'Disetujui', statusKey: 'approved' },
  rejected: { label: 'Ditolak', statusKey: 'rejected' },
  needs_revision: { label: 'Perlu Diperbaiki', statusKey: 'pending' },
};

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function DosenRevisiApprovePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['revisi-approve'] || 'Approve Revisi Sidang';
  }, [pathname]);

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
    return <LoadingState variant="table" label="Memuat daftar revisi sidang" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Review revisi pasca sidang dari mahasiswa bimbingan Anda."
      />

      <Card variant="muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            <span>Daftar Pengajuan Revisi</span>
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            Periksa berkas perbaikan dan tetapkan status persetujuan revisi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Belum ada revisi yang menunggu review"
              description="Pengajuan revisi pasca sidang dari mahasiswa bimbingan akan muncul di sini."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa / Kelompok</TableHead>
                  <TableHead className="w-[140px]">Ronde & Waktu</TableHead>
                  <TableHead>Catatan & Berkas</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[110px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((item) => {
                  const st = STATUS_LABEL[item.status] || STATUS_LABEL.pending;
                  const isGroup = item.grouping_mode === 'kelompok';
                  const displayName = isGroup
                    ? (item.kelompok_nama || `Kelompok ${item.kelompok_id}`)
                    : (item.mahasiswa_nama || '-');

                  return (
                    <TableRow key={item.id}>
                      <TableCell data-label="Mahasiswa" className="whitespace-normal break-words">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-[var(--text-strong)] break-words">
                            {displayName}
                          </span>
                          {isGroup ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--ctp-blue)/0.35)] bg-[hsl(var(--ctp-blue)/0.12)] px-1.5 py-0.5 text-[11px] font-medium text-[hsl(var(--ctp-blue))]">
                              <Users className="h-3 w-3" /> Kelompok
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums break-words">
                          {item.npm || '-'} · {item.judul_proyek || '-'}
                        </p>
                        {isGroup && item.anggota_nama ? (
                          <p className="mt-0.5 text-xs text-[var(--text-body)] break-words">
                            Anggota: {item.anggota_nama}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell data-label="Ronde & Waktu" className="whitespace-normal font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        <div className="font-medium text-[var(--text-strong)]">Ronde {item.revision_round}</div>
                        <div>{formatDateTime(item.submitted_at)}</div>
                      </TableCell>
                      <TableCell data-label="Catatan & Berkas" className="whitespace-normal break-words max-w-md">
                        {item.catatan_mahasiswa ? (
                          <p className="text-sm text-[var(--text-body)] whitespace-pre-line break-words">
                            {item.catatan_mahasiswa}
                          </p>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">-</span>
                        )}
                        {item.file_url ? (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span>Lihat file revisi</span>
                          </a>
                        ) : null}
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge status={st.statusKey} label={st.label} />
                      </TableCell>
                      <TableCell data-label="Aksi" className="sm:text-right">
                        <Button type="button" size="sm" variant="outline" onClick={() => openReview(item)}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DashboardDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title="Review Revisi"
      >
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-3">Review Revisi Sidang</h3>
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-body)] break-words">
              {selected.grouping_mode === 'kelompok'
                ? (selected.kelompok_nama || `Kelompok ${selected.kelompok_id}`)
                : selected.mahasiswa_nama}{' '}
              · Ronde {selected.revision_round}
            </p>
            <Field label="Status">
              {(a11y) => (
                <Select name="status" value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger
                    id={a11y.id}
                    aria-describedby={a11y['aria-describedby']}
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                  >
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="needs_revision">Needs Revision</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
            <Field label="Catatan untuk Mahasiswa" hint="Berikan arahan perbaikan atau konfirmasi kelengkapan revisi.">
              {(a11y) => (
                <Textarea
                  {...a11y}
                  name="catatan_dosen"
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Tuliskan catatan revisi atau alasan penolakan"
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                Batal
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Review'}
              </Button>
            </div>
          </div>
        ) : null}
      </DashboardDialog>
    </div>
  );
}
