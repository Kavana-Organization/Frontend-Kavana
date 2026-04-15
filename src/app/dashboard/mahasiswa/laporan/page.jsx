'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';

const SUBMITTED_STATUSES = new Set(['pending', 'submitted', 'approved']);

export default function LaporanPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [hasLaporan, setHasLaporan] = useState(false);
  const [existingLaporan, setExistingLaporan] = useState(null);
  const [prereqProposal, setPrereqProposal] = useState(false);
  const [prereqBimbingan, setPrereqBimbingan] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ judul: '', laporanLink: '', luaranLink: '' });

  useEffect(() => {
    if (role && role !== 'mahasiswa') { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      const lapRes = await mahasiswaAPI.getMyLaporan();
      if (lapRes.ok && Array.isArray(lapRes.data) && lapRes.data.length > 0) {
        const latest = lapRes.data[0];
        const isCompletedSubmission = SUBMITTED_STATUSES.has(String(latest.status || '').toLowerCase())
          && latest.file_url
          && latest.file_luaran;

        setExistingLaporan(latest);
        setForm((current) => ({
          ...current,
          laporanLink: latest.file_url || '',
          luaranLink: latest.file_luaran || '',
        }));

        if (isCompletedSubmission) {
          setHasLaporan(true);
          setLoading(false);
          return;
        }
      }
      const profileRes = await mahasiswaAPI.getProfile();
      if (profileRes.ok) {
        setPrereqProposal(profileRes.data.status_proposal === 'approved');
        setForm((current) => ({
          ...current,
          judul: profileRes.data.judul_proyek || profileRes.data.judul_proposal || '',
        }));
      }
      const bimRes = await mahasiswaAPI.getMyBimbingan();
      if (bimRes.ok) setPrereqBimbingan(bimRes.data?.filter(b => b.status === 'approved').length || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) { toast.error('Judul wajib diisi'); return; }
    if (!prereqProposal) { toast.error('Proposal harus disetujui sebelum submit sidang'); return; }
    if (prereqBimbingan < 8) { toast.error('Minimal 8 bimbingan disetujui sebelum submit sidang'); return; }
    if (!form.laporanLink.trim()) { toast.error('Link laporan wajib diisi'); return; }
    if (!form.luaranLink.trim()) { toast.error('Link luaran proyek wajib diisi'); return; }
    setSubmitting(true);
    try {
      const res = await mahasiswaAPI.submitLaporan({
        judul: form.judul,
        file_url: form.laporanLink,
        file_luaran: form.luaranLink,
      });
      if (res.ok) { toast.success('Laporan dan luaran proyek berhasil disubmit'); router.push('/dashboard/mahasiswa'); }
      else toast.error(res.error || 'Gagal submit');
    } catch { toast.error('Kesalahan jaringan'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  if (hasLaporan) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-[hsl(var(--ctp-green))] mb-4" />
          <h2 className="text-lg font-semibold text-[hsl(var(--ctp-text))]">Berkas Sidang Sudah Disubmit</h2>
          <p className="text-sm text-[hsl(var(--ctp-subtext0))] mt-2">Laporan sidang dan luaran proyek sudah tercatat sebagai syarat sidang.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {existingLaporan?.file_url ? (
              <a
                href={existingLaporan.file_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] px-4 py-2 text-sm text-[hsl(var(--ctp-text))]"
              >
                Buka Laporan
              </a>
            ) : null}
            {existingLaporan?.file_luaran ? (
              <a
                href={existingLaporan.file_luaran}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] px-4 py-2 text-sm text-[hsl(var(--ctp-text))]"
              >
                Buka Luaran
              </a>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const inputCls = "bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* prerequisites */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className={`border ${prereqProposal ? 'border-[hsl(var(--ctp-green)/0.45)] bg-[hsl(var(--ctp-green)/0.06)]' : 'border-[hsl(var(--ctp-red)/0.45)] bg-[hsl(var(--ctp-red)/0.06)]'} ctp-ring`}>
          <CardContent className="flex items-center gap-3 pt-6">
            {prereqProposal ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--ctp-green))]" /> : <AlertTriangle className="h-5 w-5 text-[hsl(var(--ctp-red))]" />}
            <div><p className="text-sm font-medium text-[hsl(var(--ctp-text))]">Proposal</p><p className="text-xs text-[hsl(var(--ctp-subtext0))]">{prereqProposal ? 'Disetujui' : 'Belum disetujui'}</p></div>
          </CardContent>
        </Card>
        <Card className={`border ${prereqBimbingan >= 8 ? 'border-[hsl(var(--ctp-green)/0.45)] bg-[hsl(var(--ctp-green)/0.06)]' : 'border-[hsl(var(--ctp-yellow)/0.45)] bg-[hsl(var(--ctp-yellow)/0.06)]'} ctp-ring`}>
          <CardContent className="flex items-center gap-3 pt-6">
            {prereqBimbingan >= 8 ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--ctp-green))]" /> : <AlertTriangle className="h-5 w-5 text-[hsl(var(--ctp-yellow))]" />}
            <div><p className="text-sm font-medium text-[hsl(var(--ctp-text))]">Bimbingan</p><p className="text-xs text-[hsl(var(--ctp-subtext0))]">{prereqBimbingan}/8 sesi approved</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><FileText className="h-4 w-4" /> Upload Berkas Sidang</CardTitle>
          <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
            Unggah tautan laporan sidang dan luaran proyek. Keduanya dipakai sebagai syarat sebelum sidang dijadwalkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Judul *</Label><Input value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Link Laporan Sidang *</Label><Input value={form.laporanLink} onChange={e => setForm({ ...form, laporanLink: e.target.value })} placeholder="https://drive.google.com/..." className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Link Luaran Proyek *</Label><Input value={form.luaranLink} onChange={e => setForm({ ...form, luaranLink: e.target.value })} placeholder="https://drive.google.com/..." className={inputCls} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => router.push('/dashboard/mahasiswa')} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
              <Button type="submit" disabled={submitting} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]">
                <Upload className="h-4 w-4 mr-1" /> {submitting ? 'Mengirim...' : 'Submit Berkas Sidang'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
