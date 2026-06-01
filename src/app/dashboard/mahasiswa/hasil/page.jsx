'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, CheckCircle2, XCircle, Clock, FileText, MessageSquare, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';

const STATE_CONFIG = {
  'belum-proposal': { label: 'Belum Submit Proposal', color: 'ctp-overlay1', icon: FileText },
  'proposal-pending': { label: 'Proposal Direview', color: 'ctp-yellow', icon: Clock },
  'proposal-rejected': { label: 'Proposal Ditolak', color: 'ctp-red', icon: XCircle },
  'bimbingan': { label: 'Dalam Bimbingan', color: 'ctp-blue', icon: MessageSquare },
  'belum-laporan': { label: 'Siap Submit Laporan', color: 'ctp-teal', icon: FileText },
  'laporan-pending': { label: 'Laporan Direview', color: 'ctp-yellow', icon: Clock },
  'sidang-lulus': { label: 'LULUS', color: 'ctp-green', icon: CheckCircle2 },
  'sidang-tidak-lulus': { label: 'Tidak Lulus', color: 'ctp-red', icon: XCircle },
};

export default function HasilPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bimbinganCount, setBimbinganCount] = useState(0);
  const [sidang, setSidang] = useState(null);
  const [state, setState] = useState('belum-proposal');

  useEffect(() => {
    if (role && role !== 'mahasiswa') { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const [profileRes, bimRes, sidangRes] = await Promise.all([
        mahasiswaAPI.getProfile(), mahasiswaAPI.getMyBimbingan(), mahasiswaAPI.getMySidang(),
      ]);
      if (profileRes.ok) setProfile(profileRes.data);
      if (bimRes.ok) setBimbinganCount(bimRes.data?.filter(b => b.status === 'approved').length || 0);
      if (sidangRes.ok && sidangRes.data) setSidang(sidangRes.data);

      // Calculate state
      const p = profileRes.data || {};
      if (!p.status_proposal || p.status_proposal === 'none') setState('belum-proposal');
      else if (p.status_proposal === 'pending') setState('proposal-pending');
      else if (p.status_proposal === 'rejected') setState('proposal-rejected');
      else if (p.status_proposal === 'approved') {
        const approved = bimRes.data?.filter(b => b.status === 'approved').length || 0;
        if (approved < 8) setState('bimbingan');
        else if (sidangRes.ok && sidangRes.data?.hasil) {
          setState(sidangRes.data.hasil === 'lulus' ? 'sidang-lulus' : 'sidang-tidak-lulus');
        } else setState('belum-laporan');
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  const cfg = STATE_CONFIG[state] || STATE_CONFIG['belum-proposal'];
  const Icon = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Status banner */}
      <Card className={`bg-[hsl(var(--${cfg.color})/0.08)] border-[hsl(var(--${cfg.color})/0.35)] ctp-ring`}>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl border border-[hsl(var(--${cfg.color})/0.35)] bg-[hsl(var(--${cfg.color})/0.15)]`}>
            <Icon className={`h-7 w-7 text-[hsl(var(--${cfg.color}))]`} />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Status Anda</p>
            <h2 className={`text-xl font-bold text-[hsl(var(--${cfg.color}))]`}>{cfg.label}</h2>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Proposal', ok: profile?.status_proposal === 'approved', sub: profile?.status_proposal || '-' },
          { title: 'Bimbingan', ok: bimbinganCount >= 8, sub: `${bimbinganCount}/8 approved` },
          { title: 'Laporan', ok: ['submitted','approved'].includes(sidang?.laporan_status), sub: sidang?.laporan_status || '-' },
          { title: 'Sidang', ok: sidang?.hasil === 'lulus', sub: sidang?.hasil || '-' },
        ].map((item) => (
          <Card key={item.title} className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{item.title}</p>
                {item.ok ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--ctp-green))]" /> : <Clock className="h-4 w-4 text-[hsl(var(--ctp-overlay1))]" />}
              </div>
              <p className="text-sm font-medium text-[hsl(var(--ctp-text))] mt-1 capitalize">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dosen info */}
      {profile?.dosen_nama && (
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--ctp-blue)/0.15)] text-[hsl(var(--ctp-blue))] flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Dosen Pembimbing</p>
              <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{profile.dosen_nama}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
