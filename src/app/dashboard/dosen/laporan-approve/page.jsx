'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, FileText, ExternalLink } from 'lucide-react';
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
  rejected: { label: 'Revisi', color: 'ctp-red' },
  submitted: { label: 'Menunggu', color: 'ctp-yellow' },
  pending: { label: 'Menunggu', color: 'ctp-yellow' },
  waiting: { label: 'Menunggu', color: 'ctp-yellow' },
};

const REVIEWABLE_STATUSES = new Set(['submitted', 'pending', 'waiting']);
const FILTER_OPTIONS = ['all', 'submitted', 'approved', 'rejected'];

function normalizeStatus(value) {
  return String(value || '').toLowerCase();
}

function isReviewableStatus(value) {
  return REVIEWABLE_STATUSES.has(normalizeStatus(value));
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
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Menunggu review</p>
            <p className="text-2xl font-bold text-[hsl(var(--ctp-yellow))]">{list.filter((l) => isReviewableStatus(l.status)).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Approved</p>
            <p className="text-2xl font-bold text-[hsl(var(--ctp-green))]">{list.filter((l) => normalizeStatus(l.status) === 'approved').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <FileText className="h-4 w-4" /> Daftar Laporan
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
                {f === 'all' ? 'Semua' : f === 'submitted' ? 'Menunggu' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada laporan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((l) => {
                const status = normalizeStatus(l.status);
                const st = STATUS_MAP[status] || STATUS_MAP.submitted;
                const laporanUrl = l.file_laporan || l.file_url;
                const luaranUrl = l.file_luaran;
                const display = getLaporanDisplay(l);
                return (
                  <div key={l.id || l.mahasiswa_id} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{display.title}</span>
                          <Badge className={`rounded-xl text-[10px] border border-[hsl(var(--${st.color})/0.35)] bg-[hsl(var(--${st.color})/0.12)] text-[hsl(var(--${st.color}))]`}>{st.label}</Badge>
                        </div>
                        {display.subtitle ? (
                          <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{display.subtitle}</p>
                        ) : null}
                        <p className="text-sm text-[hsl(var(--ctp-text))]">{l.judul || '-'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          {laporanUrl && (
                            <a href={laporanUrl} target="_blank" rel="noreferrer" className="text-xs text-[hsl(var(--ctp-blue))] hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Buka Laporan
                            </a>
                          )}
                          {luaranUrl && (
                            <a href={luaranUrl} target="_blank" rel="noreferrer" className="text-xs text-[hsl(var(--ctp-teal))] hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Buka Luaran
                            </a>
                          )}
                        </div>
                      </div>
                      {isReviewableStatus(status) && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => handleAction(l.id, 'approved')} className="rounded-xl h-8 bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-green))] border border-[hsl(var(--ctp-green)/0.35)]">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => { setActionModal(l.id); setCatatan(''); }} className="rounded-xl h-8 bg-[hsl(var(--ctp-red)/0.20)] text-[hsl(var(--ctp-red))] border border-[hsl(var(--ctp-red)/0.35)]">
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
        <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-3">Catatan Revisi</h3>
        <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setActionModal(null)} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
          <Button onClick={() => handleAction(actionModal, 'rejected')} className="rounded-2xl bg-[hsl(var(--ctp-red)/0.20)] text-[hsl(var(--ctp-red))] border border-[hsl(var(--ctp-red)/0.35)]">Revisi</Button>
        </div>
      </DashboardDialog>
    </motion.div>
  );
}
