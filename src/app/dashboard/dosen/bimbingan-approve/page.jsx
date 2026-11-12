'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  MessageSquare,
  QrCode,
  ShieldX,
  XCircle,
} from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { dosenAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

const STATUS_LABEL = {
  approved: 'Disetujui',
  pending: 'Menunggu',
  waiting: 'Menunggu',
  rejected: 'Revisi',
};

const REVIEWABLE_STATUSES = new Set(['pending', 'waiting']);
const FILTER_OPTIONS = ['all', 'waiting', 'approved', 'rejected'];

function normalizeStatus(value) {
  return String(value || '').toLowerCase();
}

function isReviewableStatus(value) {
  return REVIEWABLE_STATUSES.has(normalizeStatus(value));
}

function pickDisplayStatus(currentStatus, incomingStatus) {
  const current = normalizeStatus(currentStatus);
  const incoming = normalizeStatus(incomingStatus);

  if (isReviewableStatus(incoming)) return incoming;
  if (isReviewableStatus(current)) return current;
  if (current === 'approved' && incoming === 'rejected') return incoming;
  if (!current && incoming) return incoming;
  return current;
}

function aggregateBimbinganForDisplay(list) {
  const map = new Map();

  (Array.isArray(list) ? list : []).forEach((item) => {
    const status = normalizeStatus(item?.status);
    const isProyek = String(item?.track || '').includes('proyek');
    const hasKelompok = !!item?.kelompok_id;

    if (!isProyek || !hasKelompok) {
      const key = `mhs:${item.id}`;
      map.set(key, {
        ...item,
        display_key: key,
        display_name: item.mahasiswa_nama || '-',
        display_sub: item.npm || '-',
        ids: [item.id],
        status,
        is_group: false,
      });
      return;
    }

    const tanggalKey = String(item?.tanggal || '').slice(0, 10);
    const key = `grp:${item.kelompok_id}:${item.minggu_ke}:${tanggalKey}:${item.topik || ''}`;
    const current = map.get(key);

    if (!current) {
      map.set(key, {
        ...item,
        display_key: key,
        display_name: item.kelompok_nama || `Kelompok ${item.kelompok_id}`,
        display_sub: `Perwakilan: ${item.mahasiswa_nama || '-'}`,
        ids: [item.id],
        status,
        is_group: true,
      });
      return;
    }

    current.ids.push(item.id);
    current.status = pickDisplayStatus(current.status, status);
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export default function BimbinganApprovePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [detailRow, setDetailRow] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['bimbingan-approve'] || 'Approve Bimbingan';
  }, [pathname]);

  useEffect(() => {
    if (role && !['dosen', 'penguji', 'koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const res = await dosenAPI.getBimbinganList();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (targetIds, status) => {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    if (ids.length === 0) return;

    try {
      let success = 0;
      let firstError = '';

      for (const id of ids) {
        const res = await dosenAPI.approveBimbingan(id, status, catatan);
        if (res.ok) {
          success += 1;
        } else if (!firstError) {
          firstError = res.error || 'Gagal';
        }
      }

      if (success > 0) {
        toast.success(status === 'approved' ? 'Berhasil disetujui!' : 'Berhasil ditolak');
        setActionModal(null);
        setDetailRow(null);
        setCatatan('');
        loadData();
      }

      if (success !== ids.length) {
        toast.error(firstError || 'Sebagian data gagal diproses');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  const openQrModal = async (bimbinganId) => {
    if (!bimbinganId) return;
    setQrLoading(true);
    setQrModal({ bimbingan_id: bimbinganId });
    try {
      const res = await dosenAPI.getBimbinganSignature(bimbinganId);
      if (res.ok) {
        setQrModal({ bimbingan_id: bimbinganId, ...res.data });
      } else {
        toast.error(res.error || 'Tanda tangan belum tersedia');
        setQrModal(null);
      }
    } catch {
      toast.error('Kesalahan jaringan');
      setQrModal(null);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyVerifyUrl = async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL verifikasi disalin');
    } catch {
      toast.error('Gagal menyalin URL');
    }
  };

  const displayList = useMemo(() => aggregateBimbinganForDisplay(list), [list]);

  const filtered = displayList.filter((b) => {
    if (filter === 'all') return true;
    const status = normalizeStatus(b.status);
    if (filter === 'waiting') return isReviewableStatus(status);
    return status === filter;
  });

  const waitingCount = displayList.filter((b) => isReviewableStatus(b.status)).length;
  const approvedCount = displayList.filter((b) => normalizeStatus(b.status) === 'approved').length;

  if (loading) {
    return <LoadingState variant="table" label="Memuat daftar bimbingan" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Tinjau catatan sesi bimbingan mahasiswa, setujui atau minta revisi, dan akses QR verifikasi."
      />

      {/* Compact Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border border-[var(--line)] rounded-xl bg-[var(--surface-raised)]">
        <div className="p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {displayList.length}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Menunggu review</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
            {waitingCount}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Approved</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {approvedCount}
          </p>
        </div>
      </div>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span>Daftar Bimbingan</span>
          </CardTitle>
          <div role="group" aria-label="Filter status bimbingan" className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <Button
                key={f}
                type="button"
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Semua' : f === 'waiting' ? 'Menunggu' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Tidak ada data"
              description="Belum ada sesi bimbingan yang cocok dengan filter saat ini."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa / Kelompok</TableHead>
                  <TableHead className="w-[150px]">Sesi</TableHead>
                  <TableHead>Topik</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[180px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => {
                  const status = normalizeStatus(b.status);
                  const statusLabel = STATUS_LABEL[status] || STATUS_LABEL.waiting;
                  return (
                    <TableRow key={b.display_key}>
                      <TableCell data-label="Mahasiswa" className="whitespace-normal break-words">
                        <button
                          type="button"
                          onClick={() => setDetailRow(b)}
                          className="text-left hover:underline focus-visible:outline-none focus-visible:underline min-w-0"
                        >
                          <div className="text-sm font-semibold text-[var(--text-strong)] break-words">
                            {b.display_name || '-'}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] font-mono tabular-nums break-words">
                            {b.display_sub || '-'}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell data-label="Sesi" className="whitespace-normal font-mono text-xs tabular-nums text-[var(--text-body)]">
                        <div>Minggu {b.minggu_ke || '-'}</div>
                        <div className="text-[var(--text-muted)]">{b.tanggal || '-'}</div>
                      </TableCell>
                      <TableCell data-label="Topik" className="whitespace-normal break-words text-sm text-[var(--text-body)] max-w-md">
                        {b.topik || b.kegiatan || '-'}
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge status={status} label={statusLabel} />
                      </TableCell>
                      <TableCell data-label="Aksi" className="sm:text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                aria-label={`Lihat detail bimbingan ${b.display_name || ''}`}
                                onClick={() => setDetailRow(b)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Lihat detail</TooltipContent>
                          </Tooltip>

                          {isReviewableStatus(status) && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label={`Setujui bimbingan ${b.display_name || ''}`}
                                    onClick={() => handleAction(b.ids || [b.id], 'approved')}
                                    className="border-[hsl(var(--ctp-green)/0.4)] bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))] hover:bg-[hsl(var(--ctp-green)/0.20)]"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Setujui bimbingan</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label={`Tolak bimbingan ${b.display_name || ''}`}
                                    onClick={() => {
                                      setActionModal({ ids: b.ids || [b.id] });
                                      setCatatan('');
                                    }}
                                    className="border-[hsl(var(--ctp-red)/0.4)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))] hover:bg-[hsl(var(--ctp-red)/0.20)]"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Minta revisi / tolak</TooltipContent>
                              </Tooltip>
                            </>
                          )}

                          {status === 'approved' ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  aria-label={`Lihat QR tanda tangan ${b.display_name || ''}`}
                                  onClick={() => openQrModal((b.ids && b.ids[0]) || b.id)}
                                  className="border-[hsl(var(--ctp-blue)/0.4)] bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))] hover:bg-[hsl(var(--ctp-blue)/0.20)]"
                                >
                                  <QrCode className="h-4 w-4" />
                                  <span className="text-xs font-semibold">QR</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Lihat QR tanda tangan</TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer (Right Sheet) */}
      <Sheet open={!!detailRow} onOpenChange={(open) => { if (!open) setDetailRow(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {detailRow ? (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={normalizeStatus(detailRow.status)}
                    label={STATUS_LABEL[normalizeStatus(detailRow.status)] || STATUS_LABEL.waiting}
                  />
                  <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                    Minggu {detailRow.minggu_ke || '-'}
                  </span>
                </div>
                <SheetTitle className="break-words">{detailRow.display_name || '-'}</SheetTitle>
                <SheetDescription className="break-words">
                  {detailRow.display_sub || '-'} · {detailRow.tanggal || '-'}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 text-sm">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3.5 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)]">Topik / Kegiatan</p>
                    <p className="mt-0.5 text-[var(--text-strong)] break-words">
                      {detailRow.topik || detailRow.kegiatan || '-'}
                    </p>
                  </div>
                  {detailRow.catatan ? (
                    <div className="pt-2 border-t border-[var(--line)]">
                      <p className="text-xs font-medium text-[var(--text-muted)]">Catatan</p>
                      <p className="mt-0.5 text-[var(--text-body)] whitespace-pre-line break-words">
                        {detailRow.catatan}
                      </p>
                    </div>
                  ) : null}
                </div>

                {normalizeStatus(detailRow.status) === 'approved' ? (
                  <div className="rounded-xl border border-[hsl(var(--ctp-blue)/0.35)] bg-[hsl(var(--ctp-blue)/0.08)] p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-strong)]">QR Verifikasi Bimbingan</p>
                      <p className="text-xs text-[var(--text-muted)]">Tanda tangan digital sesi telah diterbitkan.</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openQrModal((detailRow.ids && detailRow.ids[0]) || detailRow.id)}
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Buka QR</span>
                    </Button>
                  </div>
                ) : null}
              </div>

              {isReviewableStatus(detailRow.status) ? (
                <SheetFooter className="border-t border-[var(--line)] sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActionModal({ ids: detailRow.ids || [detailRow.id] });
                      setCatatan('');
                    }}
                    className="border-[hsl(var(--ctp-red)/0.4)] text-[hsl(var(--ctp-red))]"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Tolak / Revisi</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleAction(detailRow.ids || [detailRow.id], 'approved')}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Setujui</span>
                  </Button>
                </SheetFooter>
              ) : null}
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Rejection Dialog */}
      <DashboardDialog
        open={!!actionModal}
        title="Alasan Revisi"
        onOpenChange={(open) => {
          if (!open) {
            setActionModal(null);
            setCatatan('');
          }
        }}
      >
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-3">Alasan Revisi</h3>
        <Field label="Catatan Revisi" hint="Berikan arahan perbaikan untuk sesi bimbingan ini.">
          {(a11y) => (
            <Textarea
              {...a11y}
              name="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Catatan revisi..."
              className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
            />
          )}
        </Field>
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => setActionModal(null)}>
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleAction(actionModal?.ids || [], 'rejected')}
          >
            Tolak
          </Button>
        </div>
      </DashboardDialog>

      {/* QR Signature Dialog */}
      <DashboardDialog
        open={!!qrModal}
        title="Tanda Tangan QR Bimbingan"
        onOpenChange={(open) => { if (!open) setQrModal(null); }}
      >
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-3 flex items-center gap-2">
          <QrCode className="h-4 w-4" /> Tanda Tangan QR Bimbingan
        </h3>
        {qrLoading ? (
          <LoadingState variant="form" label="Memuat QR tanda tangan" />
        ) : qrModal?.signature ? (
          <div className="space-y-4">
            {qrModal.signature.status === 'revoked' ? (
              <div className="rounded-xl border border-[hsl(var(--ctp-red)/0.45)] bg-[hsl(var(--ctp-red)/0.10)] px-3 py-2 text-xs text-[hsl(var(--ctp-red))] flex items-center gap-2">
                <ShieldX className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Tanda tangan ini telah dicabut
                  {qrModal.signature.revoked_reason ? ` (${qrModal.signature.revoked_reason})` : ''}.
                </span>
              </div>
            ) : null}

            <div className="flex flex-col items-center gap-2">
              {qrModal.signature.qr_data_url ? (
                <Image
                  src={qrModal.signature.qr_data_url}
                  alt="QR tanda tangan bimbingan"
                  width={176}
                  height={176}
                  unoptimized
                  className="h-44 w-44 rounded-xl border border-[var(--line)] bg-white p-2"
                />
              ) : (
                <div className="h-44 w-44 rounded-xl border border-[var(--line)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                  QR tidak tersedia
                </div>
              )}
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] tabular-nums">
                Token: {String(qrModal.signature.token).slice(0, 8)}…
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-[var(--text-muted)]">Nama</span>
                <span className="text-[var(--text-strong)] text-right break-words">{qrModal.signature.dosen_nama || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--text-muted)]">Kode Dosen</span>
                <span className="text-[var(--text-strong)] font-mono tabular-nums">{qrModal.signature.dosen_kode || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--text-muted)]">NIDN</span>
                <span className="text-[var(--text-strong)] font-mono tabular-nums">{qrModal.signature.dosen_nidn || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--text-muted)]">NIK</span>
                <span className="text-[var(--text-strong)] font-mono tabular-nums">{qrModal.signature.dosen_nik_masked || '—'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              {qrModal.signature.verify_url ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyVerifyUrl(qrModal.signature.verify_url)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin URL</span>
                  </Button>
                  <Button asChild size="sm">
                    <a
                      href={qrModal.signature.verify_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Buka Verifikasi</span>
                    </a>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">Belum ada data tanda tangan.</p>
        )}
      </DashboardDialog>
    </div>
  );
}
