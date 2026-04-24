'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';

export default function ProposalPage() {
  const router = useRouter();
  const { role, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dosenList, setDosenList] = useState([]);
  const [track, setTrack] = useState('');
  const [hasProposal, setHasProposal] = useState(false);
  const [proposalStatus, setProposalStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama: '', npm: '', judul: '', dosen: '', dosen2: '', partnerNama: '', link: '' });

  useEffect(() => {
    if (role && role !== 'mahasiswa') { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      const profileRes = await mahasiswaAPI.getProfile();
      if (profileRes.ok) {
        const p = profileRes.data;
        setTrack(p.track || '');
        setForm(f => ({ ...f, nama: p.nama || user?.name || '', npm: p.npm || '' }));
        if (['pending', 'approved'].includes(p.status_proposal)) {
          setHasProposal(true);
          setProposalStatus(p.status_proposal);
        }
      }
      const dosenRes = await mahasiswaAPI.getDosenList();
      if (dosenRes.ok) setDosenList(Array.isArray(dosenRes.data) ? dosenRes.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) { toast.error('Judul wajib diisi'); return; }
    if (!form.dosen) { toast.error('Pilih dosen pembimbing'); return; }
    if (!form.link.trim()) { toast.error('Link proposal wajib diisi'); return; }
    setSubmitting(true);
    try {
      const res = await mahasiswaAPI.submitProposal({
        judul: form.judul, dosen_id: form.dosen, dosen_id_2: form.dosen2 || null,
        partner_nama: form.partnerNama || null, link: form.link,
      });
      if (res.ok) { toast.success('Proposal berhasil disubmit!'); router.push('/dashboard/mahasiswa'); }
      else toast.error(res.error || 'Gagal submit');
    } catch { toast.error('Kesalahan jaringan'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  if (!track) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--ctp-peach))] mb-4" />
          <h2 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-2">Track Belum Dipilih</h2>
          <Button onClick={() => router.push('/dashboard/mahasiswa/track')} className="mt-4 rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-lavender)/0.35)]">Pilih Track</Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (hasProposal) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-[hsl(var(--ctp-green))] mb-4" />
          <h2 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-2">Proposal Sudah Disubmit</h2>
          <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Status: <span className="font-medium capitalize">{proposalStatus}</span></p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const inputCls = "bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><Upload className="h-4 w-4" /> Upload Proposal</CardTitle>
          <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Track: {track}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Nama</Label><Input value={form.nama} readOnly className={inputCls} /></div>
              <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">NPM</Label><Input value={form.npm} readOnly className={inputCls} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Judul *</Label><Input value={form.judul} onChange={e => setForm({...form, judul: e.target.value})} placeholder="Judul proposal" className={inputCls} /></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--ctp-subtext1))]">Dosen 1 *</Label>
                <Select value={form.dosen} onValueChange={(value) => setForm({ ...form, dosen: value })}>
                  <SelectTrigger className="w-full h-10 px-3 rounded-md text-sm bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]">
                    <SelectValue placeholder="-- Pilih --" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
                    {dosenList.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)} className="text-[hsl(var(--ctp-text))] focus:bg-[hsl(var(--ctp-surface1)/0.6)] focus:text-[hsl(var(--ctp-text))]">
                        {d.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--ctp-subtext1))]">Dosen 2</Label>
                <Select value={form.dosen2} onValueChange={(value) => setForm({ ...form, dosen2: value })}>
                  <SelectTrigger className="w-full h-10 px-3 rounded-md text-sm bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]">
                    <SelectValue placeholder="-- Pilih --" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
                    {dosenList.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)} className="text-[hsl(var(--ctp-text))] focus:bg-[hsl(var(--ctp-surface1)/0.6)] focus:text-[hsl(var(--ctp-text))]">
                        {d.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Link Proposal *</Label><Input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://drive.google.com/..." className={inputCls} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => router.push('/dashboard/mahasiswa')} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
              <Button type="submit" disabled={submitting} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]">
                <Upload className="h-4 w-4 mr-1" /> {submitting ? 'Mengirim...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
