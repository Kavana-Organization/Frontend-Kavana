'use client';

import { useEffect, useState } from 'react';
import { User, Edit, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/shared/loading-state';
import { useAuthStore } from '@/store/auth-store';
import { authAPI } from '@/lib/api';

function getInitials(n) {
  return (n || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const { user, role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', no_hp: '', alamat: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.ok) {
        setProfile(res.data || {});
        setForm({
          nama: res.data?.nama || '',
          email: res.data?.email || '',
          no_hp: res.data?.no_hp || '',
          alamat: res.data?.alamat || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await authAPI.updateProfile(form);
      if (res.ok) {
        toast.success('Profil berhasil diperbarui!');
        setEditing(false);
        loadProfile();
      } else {
        toast.error(res.error || 'Gagal memperbarui');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  if (loading) {
    return <LoadingState variant="form" label="Memuat profil" />;
  }

  const inputCls = 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-2xl"
    >
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola informasi identitas dan data kontak akun mahasiswa Anda."
      />

      {/* Identity Card */}
      <Card variant="muted">
        <CardContent className="flex items-center gap-4 p-5 sm:p-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-strong)] flex items-center justify-center text-xl sm:text-2xl font-bold font-mono shrink-0">
            {getInitials(profile.nama || user?.nama)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-strong)] break-words">
              {profile.nama || user?.nama || '-'}
            </h2>
            <p className="text-sm text-[var(--text-muted)] truncate">{profile.email || user?.email || '-'}</p>
            <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums capitalize mt-1">
              {role || 'Mahasiswa'} {profile.npm ? `· ${profile.npm}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Info Form */}
      <Card variant="muted">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <User className="h-4 w-4" /> Informasi Akun
          </CardTitle>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="min-h-[44px]"
                >
                  <X className="h-4 w-4 mr-1.5" /> Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="min-h-[44px]"
                >
                  <Save className="h-4 w-4 mr-1.5" /> Simpan
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="min-h-[44px]"
              >
                <Edit className="h-4 w-4 mr-1.5" /> Edit Profil
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nama">
            <Input
              value={form.nama}
              readOnly={!editing}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Email" hint="Email terdaftar tidak dapat diubah secara langsung.">
            <Input
              value={form.email}
              readOnly
              className={inputCls}
            />
          </Field>
          <Field label="No. HP">
            <Input
              value={form.no_hp}
              readOnly={!editing}
              onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
              placeholder="08xxxxxxxxxx"
              className={inputCls}
            />
          </Field>
          <Field label="Alamat">
            <Input
              value={form.alamat}
              readOnly={!editing}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              placeholder="Alamat domisili"
              className={inputCls}
            />
          </Field>
        </CardContent>
      </Card>
    </motion.div>
  );
}
