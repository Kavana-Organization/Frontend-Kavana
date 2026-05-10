'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownRight, Users, CalendarDays, FileText,
  UploadCloud, CheckCircle2, Clock, AlertTriangle, Plus, MessageSquareText,
  Settings, GraduationCap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { dosenAPI } from '@/lib/api';

const chartData = [
  { name: 'Sen', v: 3 }, { name: 'Sel', v: 5 }, { name: 'Rab', v: 4 },
  { name: 'Kam', v: 7 }, { name: 'Jum', v: 6 }, { name: 'Sab', v: 2 }, { name: 'Min', v: 1 },
];

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

export default function DosenDashboard() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && !['dosen', 'penguji'].includes(role)) { router.replace(`/dashboard/${role}`); return; }
    loadDashboard();
  }, [role]);

  const loadDashboard = async () => {
    try {
      const [statsRes, mhsRes] = await Promise.all([
        dosenAPI.getStats(),
        dosenAPI.getMahasiswaBimbingan(),
      ]);
      if (statsRes.ok) setStats(statsRes.data);
      if (mhsRes.ok) setMahasiswaList(Array.isArray(mhsRes.data) ? mhsRes.data : mhsRes.data?.data || []);
    } catch (err) {
      console.error('Error loading dosen dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalMhs = stats?.total_mahasiswa || mahasiswaList.length || 0;
  const pendingBimbingan = stats?.pending_bimbingan || 0;
  const pendingLaporan = stats?.pending_laporan || 0;

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
        <StatCard title="Mahasiswa bimbingan" value={String(totalMhs)} delta={`+${totalMhs}`} dir="up" sub="aktif" icon={Users} />
        <StatCard title="Bimbingan pending" value={String(pendingBimbingan)} delta={pendingBimbingan > 0 ? `+${pendingBimbingan}` : '0'} dir="up" sub="menunggu review" icon={Clock} />
        <StatCard title="Laporan pending" value={String(pendingLaporan)} delta={pendingLaporan > 0 ? `+${pendingLaporan}` : '0'} dir="up" sub="perlu ditinjau" icon={FileText} />
        <StatCard title="Bimbingan minggu ini" value={String(stats?.bimbingan_minggu_ini || 0)} delta="+0" dir="up" sub="sesi terjadwal" icon={CalendarDays} />
      </div>

      {/* Action cards + chart */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Mahasiswa list */}
        <Card className="xl:col-span-5 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
                <GraduationCap className="h-4 w-4" /> Mahasiswa bimbingan
              </CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Daftar mahasiswa yang Anda bimbing.</CardDescription>
            </div>
            <Link href="/dashboard/dosen/mahasiswa-bimbingan">
              <Button variant="secondary" className="ctp-focus h-9 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)]">
                <ArrowUpRight className="h-4 w-4 mr-2" /> Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {mahasiswaList.length === 0 ? (
              <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--ctp-overlay1))]" />
                <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada mahasiswa bimbingan</p>
              </div>
            ) : (
              mahasiswaList.slice(0, 4).map((m, i) => (
                <div key={m.id || i} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[hsl(var(--ctp-text))] truncate">{m.nama || `Mahasiswa ${i + 1}`}</div>
                      <div className="text-xs text-[hsl(var(--ctp-subtext0))]">{m.npm || '-'} · {m.track || '-'}</div>
                    </div>
                    <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))]">
                      {m.status || 'Aktif'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="xl:col-span-7 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-[hsl(var(--ctp-text))]">Aktivitas review (7 hari)</CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Jumlah bimbingan & review per hari.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="v" stroke="hsl(var(--ctp-teal))" fill="hsl(var(--ctp-teal)/0.18)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: 'Review Bimbingan', desc: 'Setujui atau revisi catatan bimbingan', href: '/dashboard/dosen/bimbingan-approve', icon: CheckCircle2, color: 'ctp-green' },
          { title: 'Review Laporan', desc: 'Tinjau laporan sidang mahasiswa', href: '/dashboard/dosen/laporan-approve', icon: UploadCloud, color: 'ctp-blue' },
          { title: 'Daftar Mahasiswa', desc: 'Lihat semua mahasiswa bimbingan', href: '/dashboard/dosen/mahasiswa-bimbingan', icon: Users, color: 'ctp-mauve' },
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
        <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Kavana — Dashboard Dosen Pembimbing</div>
        <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Theme: Catppuccin Mocha</div>
      </div>
    </motion.div>
  );
}
