'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownRight, Users, FileText, GraduationCap,
  CheckCircle2, Clock, Shield, BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { kaprodiAPI } from '@/lib/api';

function StatCard({ title, value, delta, dir, sub, icon: Icon }) {
  const Arrow = dir === 'up' ? ArrowUpRight : ArrowDownRight;
  const deltaCls = dir === 'down' ? 'text-[hsl(var(--ctp-green))]' : 'text-[hsl(var(--ctp-peach))]';
  return (
    <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
      <CardHeader className="pb-2">
        <CardDescription className="text-[hsl(var(--ctp-subtext0))]">{title}</CardDescription>
        <CardTitle className="text-[hsl(var(--ctp-text))] text-2xl tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-sm ${deltaCls}`}>
          <Arrow className="h-4 w-4" />
          <span className="font-medium">{delta}</span>
          <span className="text-[hsl(var(--ctp-subtext0))] font-normal">{sub}</span>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[hsl(var(--ctp-overlay0)/0.5)] bg-[hsl(var(--ctp-surface1)/0.6)]">
          {Icon && <Icon className="h-4 w-4 text-[hsl(var(--ctp-subtext1))]" />}
        </span>
      </CardContent>
    </Card>
  );
}

export default function KaprodiDashboard() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [totalKoordinator, setTotalKoordinator] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'kaprodi') { router.replace(`/dashboard/${role}`); return; }
    loadDashboard();
  }, [role, router]);

  const loadDashboard = async () => {
    try {
      const [statsRes, koordinatorRes] = await Promise.all([
        kaprodiAPI.getStats(),
        kaprodiAPI.getKoordinatorList(),
      ]);

      if (statsRes.ok) setStats(statsRes.data);
      if (koordinatorRes.ok) {
        const koordinatorList = Array.isArray(koordinatorRes.data) ? koordinatorRes.data : [];
        const activeKoordinator = koordinatorList.filter((k) => Boolean(k?.is_koordinator)).length;
        setTotalKoordinator(activeKoordinator);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalMahasiswa = stats?.total_mahasiswa || 0;
  const totalDosen = stats?.total_dosen || 0;
  const lulusSemesterIni = stats?.lulus_semester_ini || 0;
  const kelulusan = totalMahasiswa ? Math.round((lulusSemesterIni / totalMahasiswa) * 100) : 0;
  const trendData = useMemo(() => {
    const byAngkatan = stats?.by_angkatan || {};
    const rows = Object.entries(byAngkatan)
      .map(([angkatan, count]) => ({ name: String(angkatan), v: Number(count) || 0 }))
      .sort((a, b) => Number(a.name) - Number(b.name));
    return rows.length > 0 ? rows : [{ name: '-', v: 0 }];
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total mahasiswa" value={String(totalMahasiswa)} delta={`+${totalMahasiswa}`} dir="up" sub="aktif" icon={GraduationCap} />
        <StatCard title="Dosen pembimbing" value={String(totalDosen)} delta={`+${totalDosen}`} dir="up" sub="aktif" icon={Users} />
        <StatCard title="Koordinator" value={String(totalKoordinator)} delta={`+${totalKoordinator}`} dir="up" sub="terdaftar" icon={Shield} />
        <StatCard title="Tingkat kelulusan" value={`${kelulusan}%`} delta={`+${kelulusan}`} dir="up" sub="semester ini" icon={CheckCircle2} />
      </div>

      {/* Chart + Management */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--ctp-text))]">Distribusi angkatan</CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Jumlah mahasiswa per angkatan dari database.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="v" fill="hsl(var(--ctp-sapphire)/0.65)" radius={[10, 10, 6, 6]} maxBarSize={96} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overview */}
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <BarChart3 className="h-4 w-4" /> Overview
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Ringkasan program studi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] p-3">
              <div className="flex items-center justify-between text-sm text-[hsl(var(--ctp-text))]">
                <span className="text-[hsl(var(--ctp-subtext0))]">Completion rate</span>
                <span className="font-medium">{kelulusan}%</span>
              </div>
              <Progress value={kelulusan} className="mt-2" />
            </div>
            {[
              { label: 'Mahasiswa', val: totalMahasiswa, color: 'ctp-lavender' },
              { label: 'Dosen', val: totalDosen, color: 'ctp-teal' },
              { label: 'Koordinator', val: totalKoordinator, color: 'ctp-mauve' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3 flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--ctp-subtext0))]">{item.label}</span>
                <span className={`text-lg font-semibold text-[hsl(var(--${item.color}))]`}>{item.val}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: 'Kelola Koordinator', desc: 'Tetapkan koordinator per periode', href: '/dashboard/kaprodi/kelola-koordinator', icon: Shield, color: 'ctp-green' },
          { title: 'Daftar Dosen', desc: 'Lihat seluruh dosen pembimbing', href: '/dashboard/kaprodi/daftar-dosen', icon: Users, color: 'ctp-blue' },
          { title: 'Monitoring', desc: 'Pantau progres semua mahasiswa', href: '/dashboard/kaprodi/monitoring', icon: BarChart3, color: 'ctp-mauve' },
        ].map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring hover:bg-[hsl(var(--ctp-surface0)/0.70)] transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 pt-6">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[hsl(var(--${action.color})/0.35)] bg-[hsl(var(--${action.color})/0.12)]`}>
                  <action.icon className={`h-5 w-5 text-[hsl(var(--${action.color}))]`} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{action.title}</div>
                  <div className="text-xs text-[hsl(var(--ctp-subtext0))]">{action.desc}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-auto shrink-0 text-[hsl(var(--ctp-subtext0))]" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.30)] bg-[hsl(var(--ctp-mantle)/0.35)] px-4 py-3">
        <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Kavana — Dashboard Kaprodi</div>
        <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Theme: Catppuccin Mocha</div>
      </div>
    </motion.div>
  );
}
