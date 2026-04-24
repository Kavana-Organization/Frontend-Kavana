'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog, Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { adminAPI } from '@/lib/api';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

function getInitials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

export default function KelolaDosenPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '' });

  useEffect(() => {
    if (role && role !== 'admin') { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      const res = await adminAPI.getAllDosen();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.email || !form.password) { toast.error('Semua field wajib diisi'); return; }
    try {
      const res = await adminAPI.createDosen(form);
      if (res.ok) { toast.success('Dosen berhasil ditambahkan!'); setShowModal(false); setForm({ nama: '', email: '', password: '' }); loadData(); }
      else toast.error(res.error || 'Gagal');
    } catch { toast.error('Kesalahan jaringan'); }
  };

  const filtered = list.filter(d => !search || (d.nama||'').toLowerCase().includes(search.toLowerCase()));
  const inputCls = "bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]";

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><UserCog className="h-4 w-4" /> Kelola Dosen</CardTitle>
          <div className="flex gap-3">
            <Input placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} className={"w-48 " + inputCls} />
            <Button onClick={() => setShowModal(true)} className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]"><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12"><UserCog className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" /><p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada data</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map((d, i) => (
                <div key={d.id || i} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-green))] flex items-center justify-center text-sm font-bold">{getInitials(d.nama)}</div>
                  <div className="flex-1"><p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{d.nama || '-'}</p><p className="text-xs text-[hsl(var(--ctp-subtext0))]">{d.email || '-'}</p></div>
                  <Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">{d.jumlah_bimbingan || 0} mhs</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardDialog open={showModal} onOpenChange={setShowModal}>
        <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-4">Tambah Dosen</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div><Label className="text-[hsl(var(--ctp-subtext1))]">Nama</Label><Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className={inputCls} /></div>
          <div><Label className="text-[hsl(var(--ctp-subtext1))]">Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} /></div>
          <div><Label className="text-[hsl(var(--ctp-subtext1))]">Password</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inputCls} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" onClick={() => setShowModal(false)} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
            <Button type="submit" className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]">Tambah</Button>
          </div>
        </form>
      </DashboardDialog>
    </motion.div>
  );
}
