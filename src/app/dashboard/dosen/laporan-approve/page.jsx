'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, Eye, FileText, XCircle } from 'lucide-react';
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
  rejected: 'Revisi',
  submitted: 'Menunggu',
  pending: 'Menunggu',
  waiting: 'Menunggu',
};

const REVIEWABLE_STATUSES = new Set(['submitted', 'pending', 'waiting']);
const FILTER_OPTIONS = ['all', 'submitted', 'approved', 'rejected'];

function normalizeStatus(value) {
  return String(value || '').toLowerCase();
}

function isReviewableStatus(value) {
  return REVIEWABLE_STATUSES.has(normalizeStatus(value));
}

function getLuaranLinks(value) {
  if (!value || typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed)
        .map(([label, url]) => ({ label, url: String(url || '').trim() }))
        .filter((link) => link.url);
    }
  } catch {
    // Legacy laporan stores a single luaran URL.
  }

  return [{ label: 'Buka Luaran', url: value }];
}

function getLaporanDisplay(item) {
  const isProyek = String(item?.track || '').toLowerCase().includes('proyek');
  const anggota = String(item?.anggota_nama || '')
    .split(', ')
    .map((n) => n.trim())
    .filter(Boolean);

  if (isProyek) {
    return {
      title: item.kelompok_nama || (item?.judul ? `Kelompok Proyek - ${item.judul}` : 'Kelompok Proyek'),
      subtitle: anggota.length > 0
        ? `Anggota: ${anggota.join(', ')}`
        : `Perwakilan: ${item.mahasiswa_nama || '-'}`,
    };
  }

  return {
    title: item.mahasiswa_nama || '-',
    subtitle: item.mahasiswa_npm || '',
  };
}

export default function LaporanApprovePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [detailRow, setDetailRow] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [catatan, setCatatan] = useState('');

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['laporan-approve'] || 'Approve Laporan Sidang';
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
      const res = await dosenAPI.getLaporanList();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (laporanId, status) => {
    try {
      const res = await dosenAPI.approveLaporan(laporanId, status, catatan);
      if (res.ok) {
        toast.success(status === 'approved' ? 'Laporan disetujui!' : 'Laporan membutuhkan revisi');
        setActionModal(null);
        setDetailRow(null);
        setCatatan('');
        loadData();
      } else {
        toast.error(res.error || 'Gagal');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  const filtered = list.filter((l) => {
    if (filter === 'all') return true;
    const status = normalizeStatus(l.status);
    if (filter === 'submitted') return isReviewableStatus(status);
    return status === filter;
  });

  const waitingCount = list.filter((l) => isReviewableStatus(l.status)).length;
  const approvedCount = list.filter((l) => normalizeStatus(l.status) === 'approved').length;

  if (loading) {
    return <LoadingState variant="table" label="Memuat daftar laporan sidang" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Tinjau naskah laporan sidang dan tautan luaran proyek sebelum penjadwalan sidang."
      />

      {/* Compact Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border border-[var(--line)] rounded-xl bg-[var(--surface-raised)]">
        <div className="p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {list.length}
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
            <FileText className="h-4 w-4 shrink-0" />
            <span>Daftar Laporan</span>
          </CardTitle>
          <div role="group" aria-label="Filter status laporan" className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <Button
                key={f}
                type="button"
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Semua' : f === 'submitted' ? 'Menunggu' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Tidak ada laporan"
              description="Belum ada laporan sidang yang sesuai dengan filter yang dipilih."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa / Kelompok</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Berkas</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[160px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => {
                  const status = normalizeStatus(l.status);
                  const statusLabel = STATUS_LABEL[status] || STATUS_LABEL.submitted;
                  const laporanUrl = l.file_laporan || l.file_url;
                  const luaranLinks = getLuaranLinks(l.file_luaran);
                  const display = getLaporanDisplay(l);
                  return (
                    <TableRow key={l.id || l.mahasiswa_id}>
                      <TableCell data-label="Mahasiswa" className="whitespace-normal break-words">
                        <button
                          type="button"
                          onClick={() => setDetailRow(l)}
                          className="text-left hover:underline focus-visible:outline-none focus-visible:underline min-w-0"
                        >
                          <div className="text-sm font-semibold text-[var(--text-strong)] break-words">
                            {display.title}
                          </div>
                          {display.subtitle ? (
                            <div className="text-xs text-[var(--text-muted)] break-words">
                              {display.subtitle}
                            </div>
                          ) : null}
                        </button>
                      </TableCell>
                      <TableCell data-label="Judul" className="whitespace-normal break-words text-sm text-[var(--text-body)] max-w-md">
                        {l.judul || '-'}
                      </TableCell>
                      <TableCell data-label="Berkas" className="whitespace-normal">
                        <div className="flex flex-wrap items-center gap-2">
                          {laporanUrl && (
                            <a
                              href={laporanUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              <span>Buka Laporan</span>
                            </a>
                          )}
                          {luaranLinks.map((link) => (
                            <a
                              key={`${link.label}-${link.url}`}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--ctp-teal))] hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              <span>{link.label}</span>
                            </a>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge status={status === 'submitted' ? 'pending' : status} label={statusLabel} />
                      </TableCell>
                      <TableCell data-label="Aksi" className="sm:text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                aria-label={`Lihat detail laporan ${display.title}`}
                                onClick={() => setDetailRow(l)}
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
                                    aria-label={`Setujui laporan ${display.title}`}
                                    onClick={() => handleAction(l.id, 'approved')}
                                    className="border-[hsl(var(--ctp-green)/0.4)] bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))] hover:bg-[hsl(var(--ctp-green)/0.20)]"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Setujui laporan</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label={`Minta revisi laporan ${display.title}`}
                                    onClick={() => {
                                      setActionModal(l.id);
                                      setCatatan('');
                                    }}
                                    className="border-[hsl(var(--ctp-red)/0.4)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))] hover:bg-[hsl(var(--ctp-red)/0.20)]"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Minta revisi laporan</TooltipContent>
                              </Tooltip>
                            </>
                          )}
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
          {detailRow ? (() => {
            const detailStatus = normalizeStatus(detailRow.status);
            const detailDisplay = getLaporanDisplay(detailRow);
            const detailLaporanUrl = detailRow.file_laporan || detailRow.file_url;
            const detailLuaranLinks = getLuaranLinks(detailRow.file_luaran);
            return (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={detailStatus === 'submitted' ? 'pending' : detailStatus}
                      label={STATUS_LABEL[detailStatus] || STATUS_LABEL.submitted}
                    />
                    {detailRow.track ? (
                      <span className="text-xs text-[var(--text-muted)]">{detailRow.track}</span>
                    ) : null}
                  </div>
                  <SheetTitle className="break-words">{detailDisplay.title}</SheetTitle>
                  {detailDisplay.subtitle ? (
                    <SheetDescription className="break-words">{detailDisplay.subtitle}</SheetDescription>
                  ) : null}
                </SheetHeader>

                <div className="space-y-4 px-4 text-sm">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3.5 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-muted)]">Judul Laporan</p>
                      <p className="mt-0.5 text-[var(--text-strong)] break-words">
                        {detailRow.judul || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3.5 space-y-2">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Tautan Berkas</p>
                    <div className="flex flex-col gap-2">
                      {detailLaporanUrl ? (
                        <a
                          href={detailLaporanUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline break-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span>Buka Laporan</span>
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Tautan laporan belum tersedia.</span>
                      )}
                      {detailLuaranLinks.map((link) => (
                        <a
                          key={`${link.label}-${link.url}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--ctp-teal))] hover:underline break-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span>{link.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {isReviewableStatus(detailStatus) ? (
                  <SheetFooter className="border-t border-[var(--line)] sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActionModal(detailRow.id);
                        setCatatan('');
                      }}
                      className="border-[hsl(var(--ctp-red)/0.4)] text-[hsl(var(--ctp-red))]"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Minta Revisi</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleAction(detailRow.id, 'approved')}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Setujui</span>
                    </Button>
                  </SheetFooter>
                ) : null}
              </>
            );
          })() : null}
        </SheetContent>
      </Sheet>

      {/* Rejection Dialog */}
      <DashboardDialog
        open={!!actionModal}
        title="Catatan Revisi"
        onOpenChange={(open) => {
          if (!open) {
            setActionModal(null);
            setCatatan('');
          }
        }}
      >
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-3">Catatan Revisi</h3>
        <Field label="Catatan Revisi" hint="Jelaskan bagian laporan atau luaran yang perlu diperbaiki mahasiswa.">
          {(a11y) => (
            <Textarea
              {...a11y}
              name="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Tuliskan catatan revisi..."
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
            onClick={() => handleAction(actionModal, 'rejected')}
          >
            Revisi
          </Button>
        </div>
      </DashboardDialog>
    </div>
  );
}
