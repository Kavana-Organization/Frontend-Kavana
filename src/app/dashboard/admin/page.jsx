'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownRight, Users, Shield, Settings,
  CheckCircle2, Clock, Database, UserCog, GraduationCap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { adminAPI } from '@/lib/api';

const roleDistribution = [
  { name: 'Admin', v: 2 }, { name: 'Kaprodi', v: 1 },
  { name: 'Koordinator', v: 3 }, { name: 'Dosen', v: 12 }, { name: 'Mahasiswa', v: 148 },
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

export default function AdminDashboard() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'admin') { router.replace(`/dashboard/${role}`); return; }
    loadDashboard();
  }, [role, router]);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getStats();
      if (res.ok) setStats(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = stats?.total_users || 0;
  const totalMahasiswa = stats?.total_mahasiswa || 0;
  const totalDosen = stats?.total_dosen || 0;
  const totalAdmin = stats?.total_admin || 0;

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
        <StatCard title="Total users" value={String(totalUsers)} delta={`+${totalUsers}`} dir="up" sub="pengguna" icon={Users} />
        <StatCard title="Mahasiswa" value={String(totalMahasiswa)} delta={`+${totalMahasiswa}`} dir="up" sub="terdaftar" icon={GraduationCap} />
        <StatCard title="Dosen" value={String(totalDosen)} delta={`+${totalDosen}`} dir="up" sub="aktif" icon={UserCog} />
        <StatCard title="Sistem" value="OK" delta="" dir="up" sub="status server" icon={Database} />
      </div>

      {/* Chart + System info */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--ctp-text))]">Distribusi role pengguna</CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Jumlah pengguna per role di sistem.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleDistribution} margin={{ left: 4, right: 4, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="v" fill="hsl(var(--ctp-lavender)/0.55)" radius={[10, 10, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <Database className="h-4 w-4" /> System Info
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Status dan informasi sistem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] p-3">
              <div className="flex items-center justify-between text-sm text-[hsl(var(--ctp-text))]">
                <span className="text-[hsl(var(--ctp-subtext0))]">Uptime</span>
                <span className="font-medium text-[hsl(var(--ctp-green))]">99.9%</span>
              </div>
              <Progress value={99.9} className="mt-2" />
            </div>
            {[
              { label: 'API Version', val: 'v1.0' },
              { label: 'Env', val: 'Production' },
              { label: 'Database', val: 'MySQL' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3 flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--ctp-subtext0))]">{item.label}</span>
                <span className="text-sm font-medium text-[hsl(var(--ctp-text))]">{item.val}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: 'Kelola Users', desc: 'Manage semua pengguna sistem', href: '/dashboard/admin/kelola-users', icon: Users, color: 'ctp-green' },
          { title: 'Kelola Dosen', desc: 'Manage data dosen pembimbing', href: '/dashboard/admin/kelola-dosen', icon: UserCog, color: 'ctp-blue' },
          { title: 'Pengaturan', desc: 'Konfigurasi sistem dan setting', href: '/dashboard/settings', icon: Settings, color: 'ctp-mauve' },
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
        <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Kavana — Admin Panel</div>
        <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Mode tema mengikuti preferensi pengguna.</div>
      </div>
    </motion.div>
  );
}
