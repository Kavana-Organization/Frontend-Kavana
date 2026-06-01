'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownRight, Users, CalendarDays, FileText,
  CheckCircle2, Clock, AlertTriangle, ClipboardList, Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';

const stageData = [
  { name: 'Proposal', v: 12 }, { name: 'Validasi', v: 8 },
  { name: 'Assign', v: 6 }, { name: 'Aktif', v: 15 }, { name: 'Selesai', v: 4 },
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

export default function KoordinatorDashboard() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'koordinator') { router.replace(`/dashboard/${role}`); return; }
    loadDashboard();
  }, [role, router]);

  const loadDashboard = async () => {
    try {
      const res = await koordinatorAPI.getStats();
      if (res.ok) setStats(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalProposals = stats?.total_proposal || 0;
  const pendingProposals = stats?.pending_proposal || 0;
  const totalMahasiswa = stats?.total_mahasiswa || 0;
  const assignedDosen = stats?.assigned_dosen || 0;

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
        <StatCard title="Total proposal" value={String(totalProposals)} delta={`+${totalProposals}`} dir="up" sub="disubmit" icon={FileText} />
        <StatCard title="Proposal pending" value={String(pendingProposals)} delta={pendingProposals > 0 ? `+${pendingProposals}` : '0'} dir="up" sub="perlu validasi" icon={Clock} />
        <StatCard title="Mahasiswa aktif" value={String(totalMahasiswa)} delta={`+${totalMahasiswa}`} dir="up" sub="terdaftar" icon={Users} />
        <StatCard title="Dosen assigned" value={String(assignedDosen)} delta={`+${assignedDosen}`} dir="up" sub="pembimbing" icon={CheckCircle2} />
      </div>

      {/* Chart + Progress */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Stage chart */}
        <Card className="xl:col-span-2 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--ctp-text))]">Distribusi tahap mahasiswa</CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Sebaran status dari proposal hingga selesai.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} margin={{ left: 4, right: 4, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="v" fill="hsl(var(--ctp-mauve)/0.55)" radius={[10, 10, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Summary / compliance */}
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <AlertTriangle className="h-4 w-4" /> Compliance
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Kepatuhan proses koordinasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] p-3">
              <div className="flex items-center justify-between text-sm text-[hsl(var(--ctp-text))]">
                <span className="text-[hsl(var(--ctp-subtext0))]">Proposal validated</span>
                <span className="font-medium">{totalProposals > 0 ? Math.round(((totalProposals - pendingProposals) / totalProposals) * 100) : 0}%</span>
              </div>
              <Progress value={totalProposals > 0 ? Math.round(((totalProposals - pendingProposals) / totalProposals) * 100) : 0} className="mt-2" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Perlu validasi</div>
                <div className="mt-1 text-lg font-semibold text-[hsl(var(--ctp-peach))]">{pendingProposals}</div>
              </div>
              <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Tervalidasi</div>
                <div className="mt-1 text-lg font-semibold text-[hsl(var(--ctp-green))]">{totalProposals - pendingProposals}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: 'Validasi Proposal', desc: 'Review dan approve proposal masuk', href: '/dashboard/koordinator/validasi-proposal', icon: FileText, color: 'ctp-green' },
          { title: 'Assign Pembimbing', desc: 'Tetapkan dosen untuk mahasiswa', href: '/dashboard/koordinator/approve-pembimbing', icon: Users, color: 'ctp-blue' },
          { title: 'Jadwal Sidang', desc: 'Atur jadwal sidang proyek & TA', href: '/dashboard/koordinator/jadwal-sidang', icon: CalendarDays, color: 'ctp-mauve' },
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
        <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Kavana — Dashboard Koordinator</div>
        <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Theme: Catppuccin Mocha</div>
      </div>
    </motion.div>
  );
}
