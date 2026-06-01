'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Eye, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { dosenAPI } from '@/lib/api';

function getInitials(name) { return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

export default function MahasiswaBimbinganPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (role && !['dosen','penguji','koordinator','kaprodi'].includes(role)) { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const res = await dosenAPI.getMahasiswaBimbingan();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = list.filter(m => !search || (m.nama||'').toLowerCase().includes(search.toLowerCase()) || (m.npm||'').includes(search));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Total Mahasiswa</p><p className="text-2xl font-bold text-[hsl(var(--ctp-text))]">{list.length}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Proyek</p><p className="text-2xl font-bold text-[hsl(var(--ctp-blue))]">{list.filter(m => m.track?.includes('proyek')).length}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Internship</p><p className="text-2xl font-bold text-[hsl(var(--ctp-mauve))]">{list.filter(m => m.track?.includes('internship')).length}</p></CardContent></Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div><CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><Users className="h-4 w-4" /> Daftar Mahasiswa</CardTitle></div>
          <div className="w-64"><Input placeholder="Cari mahasiswa..." value={search} onChange={e => setSearch(e.target.value)} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" /></div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12"><Users className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" /><p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada mahasiswa ditemukan</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map((m, i) => (
                <div key={m.id || i} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] flex items-center justify-center text-sm font-bold">{getInitials(m.nama)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--ctp-text))] truncate">{m.nama || '-'}</p>
                    <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{m.npm || '-'} · {m.track || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">{m.status || 'Aktif'}</Badge>
                    <div className="text-xs text-[hsl(var(--ctp-subtext0))]">{m.bimbingan_count || 0}/8</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
