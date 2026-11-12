'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { kaprodiAPI } from '@/lib/api';

export default function MonitoringPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (role && !['kaprodi','koordinator'].includes(role)) { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const res = await kaprodiAPI.getStats?.() || { ok: true, data: {} };
      if (res.ok) setStats(res.data || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  const byStatus = stats?.by_status || {};
  const totalMahasiswa = Number(stats?.total_mahasiswa) || 0;
  const totalDosen = Number(stats?.total_dosen) || 0;
  const belumTrack = Number(byStatus['Menunggu Track'] ?? stats?.belum_track) || 0;
  const sudahTrack = Number(stats?.proyek) + Number(stats?.internship) || Math.max(0, totalMahasiswa - belumTrack);
  const proposalPending = Number(byStatus['Proposal Pending'] ?? stats?.proposal_pending) || 0;
  const dalamBimbingan = Number(byStatus['Sedang Bimbingan'] ?? stats?.dalam_bimbingan) || 0;
  const siapSidang = Number(byStatus['Siap Sidang'] ?? stats?.siap_sidang) || 0;
  const lulus = Number(byStatus['Lulus'] ?? stats?.lulus_semester_ini ?? stats?.lulus) || 0;
  const kelulusan = totalMahasiswa ? Math.round((lulus / totalMahasiswa) * 100) : 0;

  const stages = [
    { name: 'Belum Track', count: belumTrack, total: totalMahasiswa || 1, color: 'ctp-overlay1' },
    { name: 'Memilih Track', count: sudahTrack, total: totalMahasiswa || 1, color: 'ctp-blue' },
    { name: 'Proposal Pending', count: proposalPending, total: totalMahasiswa || 1, color: 'ctp-teal' },
    { name: 'Sedang Bimbingan', count: dalamBimbingan, total: totalMahasiswa || 1, color: 'ctp-lavender' },
    { name: 'Siap Sidang', count: siapSidang, total: totalMahasiswa || 1, color: 'ctp-green' },
    { name: 'Lulus', count: lulus, total: totalMahasiswa || 1, color: 'ctp-mauve' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card variant="muted"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Total Mahasiswa</p><p className="text-2xl font-bold text-[hsl(var(--ctp-text))]">{totalMahasiswa}</p></CardContent></Card>
        <Card variant="muted"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Total Dosen</p><p className="text-2xl font-bold text-[hsl(var(--ctp-blue))]">{totalDosen}</p></CardContent></Card>
        <Card variant="muted"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Tingkat Kelulusan</p><p className="text-2xl font-bold text-[hsl(var(--ctp-green))]">{kelulusan}%</p></CardContent></Card>
      </div>

      <Card variant="muted">
        <CardHeader><CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><BarChart3 className="h-4 w-4" /> Progress Mahasiswa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {stages.map(s => (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[hsl(var(--ctp-text))]">{s.name}</span>
                <span className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">{s.count}</span>
              </div>
              <div className="h-3 rounded-full bg-[hsl(var(--ctp-surface1))]">
                <div className={`h-full rounded-full bg-[hsl(var(--${s.color}))] transition-all`} style={{ width: `${Math.max(2, (s.count / s.total) * 100)}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
