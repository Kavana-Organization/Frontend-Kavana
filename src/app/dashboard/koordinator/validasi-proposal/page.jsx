'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

const STATUS_MAP = {
  approved: { label: 'Disetujui', color: 'ctp-green' },
  pending: { label: 'Pending', color: 'ctp-yellow' },
  rejected: { label: 'Ditolak', color: 'ctp-red' },
};

function getProposalStatus(item) {
  return String(item?.status_proposal || item?.status || 'pending').toLowerCase();
}

export default function ValidasiProposalPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [actionModal, setActionModal] = useState(null);
  const [actionType, setActionType] = useState('');
  const [catatan, setCatatan] = useState('');

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

  const openActionModal = (proposalId, status) => {
    setActionModal(proposalId);
    setActionType(status);
    setCatatan('');
  };

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      const res = await koordinatorAPI.validateProposal(actionModal, actionType, catatan);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Total</p>
            <p className="text-2xl font-bold text-[hsl(var(--ctp-text))]">{list.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Pending</p>
            <p className="text-2xl font-bold text-[hsl(var(--ctp-yellow))]">{list.filter((p) => getProposalStatus(p) === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Approved</p>
            <p className="text-2xl font-bold text-[hsl(var(--ctp-green))]">{list.filter((p) => getProposalStatus(p) === 'approved').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <ClipboardCheck className="h-4 w-4" /> Validasi Proposal
          </CardTitle>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <Button
                key={f}
                size="sm"
                onClick={() => setFilter(f)}
                className={`rounded-xl text-xs ${filter === f ? 'bg-[hsl(var(--ctp-lavender)/0.25)] text-[hsl(var(--ctp-text))]' : 'bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext0))]'} border border-[hsl(var(--ctp-overlay0)/0.35)]`}
              >
                {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada proposal</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => {
                const status = getProposalStatus(p);
                const st = STATUS_MAP[status] || STATUS_MAP.pending;
                const fileProposal = p.file_proposal || p.link;
                return (
                  <div key={p.id} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{p.kelompok_nama || p.nama || p.mahasiswa_nama || '-'}</span>
                          <Badge className={`rounded-xl text-[10px] border border-[hsl(var(--${st.color})/0.35)] bg-[hsl(var(--${st.color})/0.12)] text-[hsl(var(--${st.color}))]`}>{st.label}</Badge>
                        </div>
                        <p className="text-sm text-[hsl(var(--ctp-text))]">{p.judul_proyek || p.judul || '-'}</p>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{p.track || '-'} · {p.anggota?.length || 1} anggota</p>
                        {fileProposal && (
                          <a href={fileProposal} target="_blank" rel="noreferrer" className="text-xs text-[hsl(var(--ctp-blue))] hover:underline inline-flex items-center gap-1 mt-1">
                            <ExternalLink className="h-3 w-3" /> File Proposal
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={status === 'approved'}
                          onClick={() => openActionModal(p.id, 'approved')}
                          className="rounded-xl h-8 px-3 bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-green))] border border-[hsl(var(--ctp-green)/0.35)] disabled:opacity-40"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          disabled={status === 'rejected'}
                          onClick={() => openActionModal(p.id, 'rejected')}
                          className="rounded-xl h-8 px-3 bg-[hsl(var(--ctp-red)/0.20)] text-[hsl(var(--ctp-red))] border border-[hsl(var(--ctp-red)/0.35)] disabled:opacity-40"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
      >
        <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-3">{actionType === 'approved' ? 'Setujui Proposal?' : 'Tolak Proposal?'}</h3>
        <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Catatan (opsional)..." className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setActionModal(null)} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
          <Button onClick={handleAction} className={`rounded-2xl ${actionType === 'approved' ? 'bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-green))] border border-[hsl(var(--ctp-green)/0.35)]' : 'bg-[hsl(var(--ctp-red)/0.20)] text-[hsl(var(--ctp-red))] border border-[hsl(var(--ctp-red)/0.35)]'}`}>{actionType === 'approved' ? 'Setujui' : 'Tolak'}</Button>
        </div>
      </DashboardDialog>
    </motion.div>
  );
}
