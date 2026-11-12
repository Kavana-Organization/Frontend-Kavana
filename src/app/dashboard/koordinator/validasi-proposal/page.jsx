'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, ClipboardCheck, ExternalLink, XCircle } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

const ENROLLMENT_TYPE_MAP = {
  regular: { label: 'Regular', variant: 'outline' },
  repeat: { label: 'Repeat', variant: 'destructive' },
  parallel_repeat: { label: 'Paralel', variant: 'secondary' },
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

function getProposalStatus(item) {
  return String(item?.status_proposal || item?.status || 'pending').toLowerCase();
}

export default function ValidasiProposalPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [actionModal, setActionModal] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionEnrollmentId, setActionEnrollmentId] = useState(null);
  const [catatan, setCatatan] = useState('');

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['validasi-proposal'] || 'Validasi Proposal';
  }, [pathname]);

  useEffect(() => {
    if (role && !['koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const res = await koordinatorAPI.getPendingProposals();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (proposalId, status, enrollmentId) => {
    setActionModal(proposalId);
    setActionType(status);
    setActionEnrollmentId(enrollmentId || null);
    setCatatan('');
  };

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      const res = await koordinatorAPI.validateProposal(actionModal, actionType, catatan, actionEnrollmentId);
      if (res.ok) {
        toast.success(actionType === 'approved' ? 'Proposal disetujui!' : 'Proposal ditolak');
        setActionModal(null);
        loadData();
      } else {
        toast.error(res.error || 'Gagal');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  const filtered = list.filter((p) => filter === 'all' || getProposalStatus(p) === filter);
  const pendingCount = list.filter((p) => getProposalStatus(p) === 'pending').length;
  const approvedCount = list.filter((p) => getProposalStatus(p) === 'approved').length;

  if (loading) {
    return <LoadingState variant="table" label="Memuat daftar proposal" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Periksa kelayakan judul, dokumen proposal, dan jalur pengambilan mahasiswa sebelum penugasan pembimbing."
      />

      {/* Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Proposal</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {list.length}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Menunggu Validasi</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
            {pendingCount}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Disetujui</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {approvedCount}
          </p>
        </div>
      </div>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            <span>Daftar Proposal Masuk</span>
          </CardTitle>
          <div role="group" aria-label="Filter status proposal" className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <Button
                key={f.id}
                type="button"
                size="sm"
                variant={filter === f.id ? 'default' : 'outline'}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Tidak ada proposal"
              description="Belum ada proposal mahasiswa yang sesuai dengan filter status saat ini."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa / Kelompok</TableHead>
                  <TableHead>Judul Proposal</TableHead>
                  <TableHead className="w-[150px]">Track</TableHead>
                  <TableHead className="w-[130px]">Berkas</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[190px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const status = getProposalStatus(p);
                  const fileProposal = p.file_proposal || p.link;
                  const et = p.enrollment_type && p.enrollment_type !== 'regular'
                    ? (ENROLLMENT_TYPE_MAP[p.enrollment_type] || ENROLLMENT_TYPE_MAP.regular)
                    : null;

                  return (
                    <TableRow key={p.id}>
                      <TableCell data-label="Mahasiswa / Kelompok" className="whitespace-normal break-words">
                        <div className="font-medium text-[var(--text-strong)]">
                          {p.kelompok_nama || p.nama || p.mahasiswa_nama || '-'}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {et ? <Badge variant={et.variant}>{et.label}</Badge> : null}
                          {p.jalur_pengambilan && p.jalur_pengambilan !== 'regular' ? (
                            <Badge variant="outline">{p.jalur_pengambilan.toUpperCase()}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell data-label="Judul Proposal" className="whitespace-normal break-words text-[var(--text-body)]">
                        {p.judul_proyek || p.judul || '-'}
                      </TableCell>
                      <TableCell data-label="Track" className="whitespace-normal text-xs text-[var(--text-muted)]">
                        <div>{p.track || '-'}</div>
                        <div className="font-mono tabular-nums">{p.anggota?.length || 1} anggota</div>
                      </TableCell>
                      <TableCell data-label="Berkas">
                        {fileProposal ? (
                          <a
                            href={fileProposal}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span>File Proposal</span>
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">-</span>
                        )}
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell data-label="Aksi">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={status === 'approved'}
                            onClick={() => openActionModal(p.id, 'approved', p.enrollment_id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Setujui</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={status === 'rejected'}
                            onClick={() => openActionModal(p.id, 'rejected', p.enrollment_id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Tolak</span>
                          </Button>
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

      <DashboardDialog
        open={!!actionModal}
        onOpenChange={(open) => {
          if (!open) {
            setActionModal(null);
            setCatatan('');
            setActionType('');
          }
        }}
        title={actionType === 'approved' ? 'Setujui Proposal?' : 'Tolak Proposal?'}
      >
        <h3 className="mb-3 text-lg font-semibold text-[var(--text-strong)]">
          {actionType === 'approved' ? 'Setujui Proposal?' : 'Tolak Proposal?'}
        </h3>
        <div className="space-y-4">
          <Field label="Catatan Validasi (Opsional)">
            {(a11y) => (
              <Textarea
                {...a11y}
                name="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                placeholder="Catatan (opsional)..."
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
              />
            )}
          </Field>
          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>
              Batal
            </Button>
            <Button
              type="button"
              variant={actionType === 'rejected' ? 'destructive' : 'default'}
              onClick={handleAction}
            >
              {actionType === 'approved' ? 'Setujui' : 'Tolak'}
            </Button>
          </div>
        </div>
      </DashboardDialog>
    </div>
  );
}
