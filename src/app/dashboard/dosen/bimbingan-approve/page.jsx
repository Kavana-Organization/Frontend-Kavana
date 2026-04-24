'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth-store';
import { dosenAPI } from '@/lib/api';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

const STATUS_MAP = {
  approved: { label: 'Disetujui', color: 'ctp-green' },
  pending: { label: 'Menunggu', color: 'ctp-yellow' },
  waiting: { label: 'Menunggu', color: 'ctp-yellow' },
  rejected: { label: 'Revisi', color: 'ctp-red' },
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
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [actionModal, setActionModal] = useState(null);
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    if (role && !['dosen', 'koordinator', 'kaprodi'].includes(role)) {
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

  const displayList = useMemo(() => aggregateBimbinganForDisplay(list), [list]);

  const filtered = displayList.filter((b) => {
    if (filter === 'all') return true;
    const status = normalizeStatus(b.status);
    if (filter === 'waiting') return isReviewableStatus(status);
    return status === filter;
  });

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
            <p className="text-2xl font-bold text-[hsl(var(--ctp-text))]">{displayList.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Menunggu review</p>
            <p className="text-2xl font-bold text-[hsl(var(--ctp-yellow))]">{displayList.filter((b) => isReviewableStatus(b.status)).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Approved</p>
            <p className="text-2xl font-bold text-[hsl(var(--ctp-green))]">{displayList.filter((b) => normalizeStatus(b.status) === 'approved').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <MessageSquare className="h-4 w-4" /> Daftar Bimbingan
          </CardTitle>
          <div className="flex gap-2">
            {FILTER_OPTIONS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'secondary'}
                onClick={() => setFilter(f)}
                className={`rounded-xl text-xs ${filter === f ? 'bg-[hsl(var(--ctp-lavender)/0.25)] text-[hsl(var(--ctp-text))]' : 'bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext0))]'} border border-[hsl(var(--ctp-overlay0)/0.35)]`}
              >
                {f === 'all' ? 'Semua' : f === 'waiting' ? 'Menunggu' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((b) => {
                const status = normalizeStatus(b.status);
                const st = STATUS_MAP[status] || STATUS_MAP.waiting;
                return (
                  <div key={b.display_key} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{b.display_name || '-'}</span>
                          <Badge className={`rounded-xl text-[10px] border border-[hsl(var(--${st.color})/0.35)] bg-[hsl(var(--${st.color})/0.12)] text-[hsl(var(--${st.color}))]`}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                          Minggu {b.minggu_ke || '-'} - {b.tanggal || '-'}
                          {b.display_sub ? ` - ${b.display_sub}` : ''}
                        </p>
                        <p className="text-sm text-[hsl(var(--ctp-text))] mt-1">{b.topik || b.kegiatan || '-'}</p>
                      </div>
                      {isReviewableStatus(status) && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => handleAction(b.ids || [b.id], 'approved')} className="rounded-xl h-8 bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-green))] border border-[hsl(var(--ctp-green)/0.35)]">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => { setActionModal({ ids: b.ids || [b.id] }); setCatatan(''); }} className="rounded-xl h-8 bg-[hsl(var(--ctp-red)/0.20)] text-[hsl(var(--ctp-red))] border border-[hsl(var(--ctp-red)/0.35)]">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
          }
        }}
      >
        <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-3">Alasan Revisi</h3>
        <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Catatan revisi..." className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setActionModal(null)} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
          <Button onClick={() => handleAction(actionModal?.ids || [], 'rejected')} className="rounded-2xl bg-[hsl(var(--ctp-red)/0.20)] text-[hsl(var(--ctp-red))] border border-[hsl(var(--ctp-red)/0.35)]">Tolak</Button>
        </div>
      </DashboardDialog>
    </motion.div>
  );
}
