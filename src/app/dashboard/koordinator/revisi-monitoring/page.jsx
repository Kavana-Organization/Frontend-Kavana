'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Clock, CheckCircle2, XCircle, AlertTriangle, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';

const STATUS_LABEL = {
  belum_submit: { label: 'Belum Submit', color: 'ctp-overlay1', Icon: Inbox },
  pending: { label: 'Menunggu Review', color: 'ctp-yellow', Icon: Clock },
  approved: { label: 'Disetujui', color: 'ctp-green', Icon: CheckCircle2 },
  rejected: { label: 'Ditolak', color: 'ctp-red', Icon: XCircle },
  needs_revision: { label: 'Perlu Diperbaiki', color: 'ctp-peach', Icon: AlertTriangle },
};

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'belum_submit', label: 'Belum Submit' },
  { id: 'pending', label: 'Menunggu Review' },
  { id: 'approved', label: 'Approved' },
];

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function MonitoringRevisiPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (role && !['koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await koordinatorAPI.getRevisiMonitoring();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (tab === 'all') return list;
    return list.filter((row) => String(row.revisi_status || '').toLowerCase() === tab);
  }, [list, tab]);

  const counts = useMemo(() => {
    const c = { belum_submit: 0, pending: 0, approved: 0, rejected: 0, needs_revision: 0 };
    for (const row of list) {
      const s = String(row.revisi_status || 'belum_submit').toLowerCase();
      c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [list]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <BarChart3 className="h-4 w-4" /> Monitoring Revisi Sidang
          </CardTitle>
          <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
            Status revisi pasca sidang dari mahasiswa/kelompok yang lulus dengan revisi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {TABS.map((t) => {
              const active = tab === t.id;
              const count = t.id === 'all' ? list.length : (counts[t.id] || 0);
              return (
                <Button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-2xl border ${
                    active
                      ? 'bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] border-[hsl(var(--ctp-lavender)/0.40)]'
                      : 'bg-[hsl(var(--ctp-surface1)/0.30)] text-[hsl(var(--ctp-subtext1))] border-[hsl(var(--ctp-overlay0)/0.35)] hover:bg-[hsl(var(--ctp-surface1)/0.50)]'
                  }`}
                >
                  {t.label} <span className="ml-1 text-xs opacity-70">({count})</span>
                </Button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-[hsl(var(--ctp-subtext0))] py-8 text-center">Tidak ada data pada filter ini.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((row, idx) => {
                const st = STATUS_LABEL[row.revisi_status] || STATUS_LABEL.belum_submit;
                const Icon = st.Icon;
                return (
                  <div key={`${row.kelompok_id || row.mahasiswa_id || idx}:${row.sidang_id}`} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge className={`rounded-xl border bg-[hsl(var(--${st.color})/0.12)] text-[hsl(var(--${st.color}))] border-[hsl(var(--${st.color})/0.35)]`}>
                            <Icon className="h-3 w-3 mr-1" /> {st.label}
                          </Badge>
                          <span className="text-xs text-[hsl(var(--ctp-subtext0))]">Ronde {row.revisi_round || 0}</span>
                        </div>
                        <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{row.display_nama || '-'}</p>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{row.judul_proyek || '-'}</p>
                        <div className="mt-1 grid gap-1 text-xs text-[hsl(var(--ctp-subtext1))] sm:grid-cols-3">
                          <div>Pembimbing: {row.dosen_nama || '-'}</div>
                          <div>Last submit: {formatDateTime(row.last_submitted_at)}</div>
                          <div>Last review: {formatDateTime(row.last_reviewed_at)}</div>
                        </div>
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
