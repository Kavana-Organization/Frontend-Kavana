'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, UserPlus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

function getInitials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

export default function ApprovePembimbingPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [mahasiswa, setMahasiswa] = useState([]);
  const [dosen, setDosen] = useState([]);
  const [modal, setModal] = useState(null);
  const [selectedDosen, setSelectedDosen] = useState('');

  useEffect(() => {
    if (role && !['koordinator','kaprodi'].includes(role)) { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      const [mRes, dRes] = await Promise.all([koordinatorAPI.getMahasiswaList(), koordinatorAPI.getDosenList()]);
      if (mRes.ok) setMahasiswa(Array.isArray(mRes.data) ? mRes.data : []);
      if (dRes.ok) setDosen(Array.isArray(dRes.data) ? dRes.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedDosen) { toast.error('Pilih dosen'); return; }
    try {
      const res = await koordinatorAPI.assignDosen(modal, selectedDosen);
      if (res.ok) { toast.success('Dosen berhasil ditugaskan!'); setModal(null); loadData(); }
      else toast.error(res.error || 'Gagal');
    } catch { toast.error('Kesalahan jaringan'); }
  };

  const needAssign = mahasiswa.filter(m => !m.dosen_id && m.status_proposal === 'approved');
  const assigned = mahasiswa.filter(m => !!m.dosen_id);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Total</p><p className="text-2xl font-bold text-[hsl(var(--ctp-text))]">{mahasiswa.length}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Belum Ditugaskan</p><p className="text-2xl font-bold text-[hsl(var(--ctp-peach))]">{needAssign.length}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Sudah Ditugaskan</p><p className="text-2xl font-bold text-[hsl(var(--ctp-green))]">{assigned.length}</p></CardContent></Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader><CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><UserCheck className="h-4 w-4" /> Penugasan Pembimbing</CardTitle></CardHeader>
        <CardContent>
          {needAssign.length === 0 ? (
            <div className="text-center py-12"><UserCheck className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" /><p className="text-sm text-[hsl(var(--ctp-subtext0))]">Semua mahasiswa sudah memiliki pembimbing</p></div>
          ) : (
            <div className="space-y-2">
              {needAssign.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] flex items-center justify-center text-sm font-bold">{getInitials(m.nama)}</div>
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{m.nama}</p>
                      <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{m.npm} · {m.track || '-'}</p>
                      {m.usulan_dosen_nama ? (
                        <p className="mt-1 text-xs text-[hsl(var(--ctp-blue))]">
                          Usulan pembimbing: <span className="font-medium">{m.usulan_dosen_nama}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => { setModal(m.id); setSelectedDosen(''); }} className="rounded-xl bg-[hsl(var(--ctp-blue)/0.20)] text-[hsl(var(--ctp-blue))] border border-[hsl(var(--ctp-blue)/0.35)]"><UserPlus className="h-4 w-4 mr-1" /> Assign</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardDialog open={!!modal} onOpenChange={(open) => !open && setModal(null)}>
        <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-3">Pilih Dosen Pembimbing</h3>
        {mahasiswa.find((item) => item.id === modal)?.usulan_dosen_nama ? (
          <div className="mb-3 rounded-xl border border-[hsl(var(--ctp-blue)/0.30)] bg-[hsl(var(--ctp-blue)/0.10)] px-3 py-2 text-sm text-[hsl(var(--ctp-text))]">
            Usulan mahasiswa: <span className="font-medium text-[hsl(var(--ctp-blue))]">{mahasiswa.find((item) => item.id === modal)?.usulan_dosen_nama}</span>
          </div>
        ) : null}
        <Select value={selectedDosen} onValueChange={setSelectedDosen}>
          <SelectTrigger className="w-full h-10 px-3 rounded-md text-sm bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]">
            <SelectValue placeholder="-- Pilih Dosen --" />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
            {dosen.map((d) => (
              <SelectItem key={d.id} value={String(d.id)} className="text-[hsl(var(--ctp-text))] focus:bg-[hsl(var(--ctp-surface1)/0.6)] focus:text-[hsl(var(--ctp-text))]">
                {d.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setModal(null)} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
          <Button onClick={handleAssign} className="rounded-2xl bg-[hsl(var(--ctp-blue)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-blue)/0.35)]">Tugaskan</Button>
        </div>
      </DashboardDialog>
    </motion.div>
  );
}
