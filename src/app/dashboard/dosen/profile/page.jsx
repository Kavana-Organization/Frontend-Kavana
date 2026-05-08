'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { authAPI, dosenAPI } from '@/lib/api';

function getInitials(n) {
  return (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function DosenProfilePage() {
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', kode_dosen: '', nik: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await dosenAPI.getProfile();
      if (res.ok) {
        const data = res.data || {};
        setProfile(data);
        setForm({
          nama: data.nama || '',
          email: data.email || '',
          kode_dosen: data.kode_dosen || '',
          // NIK lengkap hanya pemilik akun yg lihat — bisa diisi ulang saat edit
          nik: data.nik || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (form.nik && !/^\d{16}$/.test(form.nik.replace(/\s+/g, ''))) {
      toast.error('NIK harus 16 digit angka');
      return;
    }
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        nama: form.nama,
        email: form.email,
        kode_dosen: form.kode_dosen.trim() || undefined,
        nik: form.nik ? form.nik.replace(/\s+/g, '') : undefined,
      });
      if (res.ok) {
        toast.success('Profil berhasil diperbarui');
        setEditing(false);
        await loadProfile();
      } else {
        toast.error(res.error || 'Gagal memperbarui profil');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = 'bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]';
  const signatureReady = !!profile.signature_ready;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
      {/* Identitas singkat */}
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="h-20 w-20 rounded-full bg-[hsl(var(--ctp-lavender)/0.25)] text-[hsl(var(--ctp-text))] flex items-center justify-center text-2xl font-bold">
            {getInitials(profile.nama)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[hsl(var(--ctp-text))]">{profile.nama || '-'}</h2>
            <p className="text-sm text-[hsl(var(--ctp-subtext0))]">{profile.email || '-'}</p>
            <p className="text-xs text-[hsl(var(--ctp-subtext0))] capitalize mt-1">
              {role || '-'} {profile.nidn ? `· NIDN ${profile.nidn}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Banner kelengkapan tanda tangan */}
      {!signatureReady ? (
        <div className="rounded-2xl border border-[hsl(var(--ctp-peach)/0.45)] bg-[hsl(var(--ctp-peach)/0.10)] p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-[hsl(var(--ctp-peach))] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[hsl(var(--ctp-peach))]">Lengkapi identitas tanda tangan</p>
            <p className="text-xs text-[hsl(var(--ctp-subtext1))] mt-1">
              Kode Dosen dan NIK akan disertakan ke tanda tangan QR pada formulir bimbingan yang Anda setujui.
              Tanpa data ini, QR tetap diterbitkan tetapi identitas resmi tidak ditampilkan saat diverifikasi.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[hsl(var(--ctp-green)/0.45)] bg-[hsl(var(--ctp-green)/0.10)] p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 mt-0.5 text-[hsl(var(--ctp-green))] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[hsl(var(--ctp-green))]">Tanda tangan digital aktif</p>
            <p className="text-xs text-[hsl(var(--ctp-subtext1))] mt-1">
              Identitas Anda akan otomatis tertanam pada QR untuk setiap sesi bimbingan yang Anda approve.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <User className="h-4 w-4" /> Informasi Akun
          </CardTitle>
          <Button
            type="button"
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
            className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-lavender)/0.35)]"
          >
            {editing ? (saving ? 'Menyimpan...' : 'Simpan') : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-[hsl(var(--ctp-subtext1))]">Nama</Label>
            <Input
              value={form.nama}
              readOnly={!editing}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[hsl(var(--ctp-subtext1))]">Email</Label>
            <Input value={form.email} readOnly className={inputCls} />
          </div>
          <div className="space-y-2">
            <Label className="text-[hsl(var(--ctp-subtext1))]">NIDN</Label>
            <Input value={profile.nidn || '-'} readOnly className={inputCls} />
          </div>
          <div className="space-y-2">
            <Label className="text-[hsl(var(--ctp-subtext1))]">Kode Dosen</Label>
            <Input
              value={form.kode_dosen}
              readOnly={!editing}
              onChange={(e) => setForm({ ...form, kode_dosen: e.target.value })}
              placeholder="Contoh: ULBI-D4TI-001"
              maxLength={20}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[hsl(var(--ctp-subtext1))]">NIK</Label>
            <Input
              value={editing ? form.nik : (profile.nik_masked || '-')}
              readOnly={!editing}
              onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
              placeholder="16 digit"
              inputMode="numeric"
              className={inputCls}
            />
            {editing ? (
              <p className="text-[10px] text-[hsl(var(--ctp-overlay1))]">
                NIK lengkap hanya disimpan di server. Pada halaman verifikasi publik, hanya versi tersembunyi yang ditampilkan.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
