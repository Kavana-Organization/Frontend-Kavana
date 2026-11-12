'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/shared/loading-state';
import { useAuthStore } from '@/store/auth-store';
import { authAPI, dosenAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

function getInitials(n) {
  return (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function DosenProfilePage() {
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', kode_dosen: '', nik: '' });
  const [saving, setSaving] = useState(false);

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP.profile || 'Profil Saya';
  }, [pathname]);

  useEffect(() => {
    loadProfile();
  }, []);

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
    return <LoadingState variant="form" label="Memuat profil dosen" />;
  }

  const inputCls = 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]';
  const signatureReady = !!profile.signature_ready;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={pageTitle}
        subtitle="Kelola identitas akun dan informasi tanda tangan digital Anda."
      />

      {/* Identitas singkat */}
      <Card variant="muted">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="h-16 w-16 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text-strong)] flex items-center justify-center text-xl font-semibold">
            {getInitials(profile.nama)}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--text-strong)] break-words">
              {profile.nama || '-'}
            </h2>
            <p className="text-sm text-[var(--text-muted)] break-all">{profile.email || '-'}</p>
            <p className="text-xs text-[var(--text-muted)] capitalize mt-1 font-mono tabular-nums">
              {role || '-'} {profile.nidn ? `· NIDN ${profile.nidn}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Banner kelengkapan tanda tangan */}
      {!signatureReady ? (
        <div className="rounded-xl border border-[hsl(var(--ctp-peach)/0.45)] bg-[hsl(var(--ctp-peach)/0.10)] p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-[hsl(var(--ctp-peach))] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[hsl(var(--ctp-peach))]">Lengkapi identitas tanda tangan</p>
            <p className="text-xs text-[var(--text-body)] mt-1">
              Kode Dosen dan NIK akan disertakan ke tanda tangan QR pada formulir bimbingan yang Anda setujui.
              Tanpa data ini, QR tetap diterbitkan tetapi identitas resmi tidak ditampilkan saat diverifikasi.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[hsl(var(--ctp-green)/0.45)] bg-[hsl(var(--ctp-green)/0.10)] p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 mt-0.5 text-[hsl(var(--ctp-green))] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[hsl(var(--ctp-green))]">Tanda tangan digital aktif</p>
            <p className="text-xs text-[var(--text-body)] mt-1">
              Identitas Anda akan otomatis tertanam pada QR untuk setiap sesi bimbingan yang Anda approve.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <Card variant="muted">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <User className="h-4 w-4 shrink-0" />
            <span>Informasi Akun</span>
          </CardTitle>
          <Button
            type="button"
            variant={editing ? 'default' : 'outline'}
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
          >
            {editing ? (saving ? 'Menyimpan...' : 'Simpan') : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nama">
            {(a11y) => (
              <Input
                {...a11y}
                name="nama"
                value={form.nama}
                readOnly={!editing}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className={inputCls}
              />
            )}
          </Field>
          <Field label="Email">
            {(a11y) => (
              <Input
                {...a11y}
                name="email"
                value={form.email}
                readOnly
                className={inputCls}
              />
            )}
          </Field>
          <Field label="NIDN">
            {(a11y) => (
              <Input
                {...a11y}
                name="nidn"
                value={profile.nidn || '-'}
                readOnly
                className={`${inputCls} font-mono tabular-nums`}
              />
            )}
          </Field>
          <Field label="Kode Dosen">
            {(a11y) => (
              <Input
                {...a11y}
                name="kode_dosen"
                value={form.kode_dosen}
                readOnly={!editing}
                onChange={(e) => setForm({ ...form, kode_dosen: e.target.value })}
                placeholder="Contoh: ULBI-D4TI-001"
                maxLength={20}
                className={`${inputCls} font-mono`}
              />
            )}
          </Field>
          <Field
            label="NIK"
            hint={
              editing
                ? 'NIK lengkap hanya disimpan di server. Pada halaman verifikasi publik, hanya versi tersembunyi yang ditampilkan.'
                : undefined
            }
          >
            {(a11y) => (
              <Input
                {...a11y}
                name="nik"
                value={editing ? form.nik : (profile.nik_masked || '-')}
                readOnly={!editing}
                onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                placeholder="16 digit"
                inputMode="numeric"
                className={`${inputCls} font-mono tabular-nums`}
              />
            )}
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
