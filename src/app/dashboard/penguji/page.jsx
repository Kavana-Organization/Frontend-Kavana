'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CheckCircle2, Clock3, FileText, GraduationCap, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { pengujiAPI } from '@/lib/api';

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getProfileIds(profile) {
  return [profile?.id, profile?.dosen_id, profile?.user_id]
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function isMySidang(item, profile) {
  const profileIds = getProfileIds(profile);
  const pengujiId = Number(item?.penguji_id);
  if (profileIds.length > 0 && Number.isFinite(pengujiId)) {
    return profileIds.includes(pengujiId);
  }

  const profileName = normalizeText(profile?.nama);
  const pengujiName = normalizeText(item?.penguji_nama || item?.nama_penguji);
  if (profileName && pengujiName) return profileName === pengujiName;

  return true;
}

function StatCard({ title, value, caption, icon: Icon }) {
  return (
    <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
      <CardHeader className="pb-2">
        <CardDescription className="text-[hsl(var(--ctp-subtext0))]">{title}</CardDescription>
        <CardTitle className="text-[hsl(var(--ctp-text))] text-2xl tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-sm text-[hsl(var(--ctp-subtext0))]">{caption}</span>
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[hsl(var(--ctp-overlay0)/0.5)] bg-[hsl(var(--ctp-surface1)/0.6)]">
          {Icon && <Icon className="h-4 w-4 text-[hsl(var(--ctp-subtext1))]" />}
        </span>
      </CardContent>
    </Card>
  );
}

export default function PengujiDashboardPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidang, setSidang] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (role && role !== 'penguji') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const [profileRes, sidangRes] = await Promise.all([
        pengujiAPI.getProfile(),
        pengujiAPI.getSidangList(),
      ]);
      const nextProfile = profileRes.ok ? profileRes.data : null;
      setProfile(nextProfile);
      if (sidangRes.ok) {
        const rows = Array.isArray(sidangRes.data) ? sidangRes.data : sidangRes.data?.data || [];
        setSidang(rows.filter((item) => isMySidang(item, nextProfile)));
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = sidang.length;
    const pending = sidang.filter((item) => String(item?.status || '').toLowerCase() !== 'completed').length;
    const revisi = sidang.filter((item) => item?.hasil_sidang === 'lulus_revisi').length;
    const completed = sidang.filter((item) => String(item?.status || '').toLowerCase() === 'completed').length;
    return { total, pending, revisi, completed };
  }, [sidang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total sidang" value={String(stats.total)} caption="Sidang yang melibatkan Anda" icon={GraduationCap} />
        <StatCard title="Perlu hasil" value={String(stats.pending)} caption="Menunggu keputusan penguji" icon={Clock3} />
        <StatCard title="Revisi" value={String(stats.revisi)} caption="Mahasiswa perlu revisi" icon={FileText} />
        <StatCard title="Selesai" value={String(stats.completed)} caption="Hasil sudah ditentukan" icon={CheckCircle2} />
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <GraduationCap className="h-4 w-4" /> Sidang Penguji
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
              Tentukan hasil sidang: lulus, lulus dengan revisi, atau tidak lulus.
            </CardDescription>
          </div>
          <Link href="/dashboard/penguji/sidang">
            <Button className="rounded-2xl bg-[hsl(var(--ctp-blue)/0.18)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-blue)/0.35)]">
              <ArrowUpRight className="h-4 w-4 mr-1" /> Buka Sidang
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {sidang.length === 0 ? (
            <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-8 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--ctp-overlay1))]" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada sidang untuk akun penguji ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sidang.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[hsl(var(--ctp-text))]">
                        {item.display_nama || item.mahasiswa_nama || '-'}
                      </p>
                      <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                        {item.display_npm || item.npm || '-'} - {item.judul_proyek || '-'}
                      </p>
                    </div>
                    <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))]">
                      {item.hasil_sidang || item.status || 'scheduled'}
                    </Badge>
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
