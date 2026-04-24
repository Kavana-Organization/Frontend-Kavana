'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { authAPI } from '@/lib/api';

function getInitials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

export default function ProfilePage() {
  const { user, role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', no_hp: '', alamat: '' });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.ok) { setProfile(res.data || {}); setForm({ nama: res.data?.nama || '', email: res.data?.email || '', no_hp: res.data?.no_hp || '', alamat: res.data?.alamat || '' }); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      const res = await authAPI.updateProfile(form);
      if (res.ok) { toast.success('Profil berhasil diperbarui!'); setEditing(false); loadProfile(); }
      else toast.error(res.error || 'Gagal memperbarui');
    } catch { toast.error('Kesalahan jaringan'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  const inputCls = "bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
      {/* Avatar */}
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-[hsl(var(--ctp-lavender)/0.25)] text-[hsl(var(--ctp-text))] flex items-center justify-center text-2xl font-bold">{getInitials(profile.nama)}</div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[hsl(var(--ctp-text))]">{profile.nama || '-'}</h2>
            <p className="text-sm text-[hsl(var(--ctp-subtext0))]">{profile.email || '-'}</p>
            <p className="text-xs text-[hsl(var(--ctp-subtext0))] capitalize mt-1">{role || '-'} · {profile.npm || profile.nip || ''}</p>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between">
          <div><CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><User className="h-4 w-4" /> Informasi Akun</CardTitle></div>
          <Button onClick={() => editing ? handleSave() : setEditing(true)} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-lavender)/0.35)]">{editing ? 'Simpan' : 'Edit'}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Nama</Label><Input value={form.nama} readOnly={!editing} onChange={e => setForm({...form, nama: e.target.value})} className={inputCls} /></div>
          <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Email</Label><Input value={form.email} readOnly className={inputCls} /></div>
          <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">No. HP</Label><Input value={form.no_hp} readOnly={!editing} onChange={e => setForm({...form, no_hp: e.target.value})} className={inputCls} /></div>
          <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Alamat</Label><Input value={form.alamat} readOnly={!editing} onChange={e => setForm({...form, alamat: e.target.value})} className={inputCls} /></div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
