'use client';

import { useCallback, useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User, Mail, Phone, GraduationCap, Hash, Camera, Save,
  Shield, Briefcase, Calendar, Pencil, X, Key, Sun, Moon,
  LogOut, ChevronRight,
} from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/shared/loading-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { useAuthStore } from '@/store/auth-store';
import { authAPI, mahasiswaAPI, dosenAPI, koordinatorAPI, kaprodiAPI, uploadAPI } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/constants';

function getProfileAPI(role) {
  switch (role) {
    case 'mahasiswa': return mahasiswaAPI.getProfile;
    case 'dosen': return dosenAPI.getProfile;
    case 'koordinator': return koordinatorAPI.getProfile;
    case 'kaprodi': return kaprodiAPI.getProfile;
    default: return authAPI.getProfile;
  }
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function useThemeLocal() {
  const resolveTheme = useCallback((value) => {
    if (value === 'dark' || value === 'light') return value;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return resolveTheme(localStorage.getItem('kavana-theme'));
  });
  const mounted = useIsHydrated();

  const applyTheme = useCallback((t, animate = true) => {
    const root = document.documentElement;
    if (animate) {
      root.classList.add('theme-transition');
      setTimeout(() => root.classList.remove('theme-transition'), 400);
    }
    root.classList.remove('light', 'dark');
    root.classList.add(t === 'dark' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    applyTheme(theme, false);
  }, [theme, applyTheme]);

  const setTheme = (t) => {
    const nextTheme = t === 'dark' ? 'dark' : 'light';
    setThemeState(nextTheme);
    localStorage.setItem('kavana-theme', nextTheme);
  };

  return { theme, setTheme, mounted };
}

export default function ProfilePage() {
  const router = useRouter();
  const { role, setUser, logout } = useAuthStore();
  const { theme, setTheme, mounted } = useThemeLocal();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit form
  const [form, setForm] = useState({ nama: '', email: '', no_wa: '' });

  // Password form
  const [pwForm, setPwForm] = useState({ oldPw: '', newPw: '', confirmPw: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const isMahasiswa = role === 'mahasiswa';
  const roleDisplay = ROLE_LABEL[role] || role || '-';

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const fetchProfile = getProfileAPI(role);
      const res = await fetchProfile();
      if (res.ok) {
        setProfile(res.data);
        setUser(res.data);
        setForm({
          nama: res.data.nama || '',
          email: res.data.email || '',
          no_wa: res.data.no_wa || res.data.whatsapp || '',
        });
      }
    } catch {
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  }, [role, setUser]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.email.trim()) {
      toast.error('Nama dan email wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = { nama: form.nama.trim(), email: form.email.trim() };
      if (isMahasiswa && form.no_wa) payload.whatsapp = form.no_wa.trim();

      const res = await authAPI.updateProfile(payload);
      if (res.ok) {
        setProfile((prev) => ({ ...prev, ...payload }));
        setUser({ ...profile, ...payload });
        setEditing(false);
        toast.success('Profil berhasil disimpan!');
      } else {
        toast.error(res.error || 'Gagal menyimpan');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    const { oldPw, newPw, confirmPw } = pwForm;
    if (!oldPw || !newPw) { toast.error('Field wajib diisi'); return; }
    if (newPw !== confirmPw) { toast.error('Konfirmasi password tidak cocok'); return; }
    if (newPw.length < 6) { toast.error('Password minimal 6 karakter'); return; }

    setPwSaving(true);
    try {
      const res = await authAPI.changePassword(oldPw, newPw);
      if (res.ok) {
        toast.success('Password berhasil diubah!');
        setPwForm({ oldPw: '', newPw: '', confirmPw: '' });
      } else {
        toast.error(res.error || 'Gagal mengubah password');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setPwSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedImageTypes = ['image/png', 'image/jpeg'];
    if (!allowedImageTypes.includes(file.type)) {
      toast.error('Foto profil harus PNG, JPG, atau JPEG');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const res = await uploadAPI.uploadProfile(file);
      if (res.ok) {
        toast.success('Foto profil berhasil diupload!');
        await loadProfile();
      } else {
        toast.error(res.data?.error || res.data?.message || 'Gagal upload foto');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelEdit = () => {
    setForm({
      nama: profile?.nama || '',
      email: profile?.email || '',
      no_wa: profile?.no_wa || profile?.whatsapp || '',
    });
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Berhasil logout');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Profil Saya"
          subtitle="Kelola informasi identitas, preferensi tampilan, dan keamanan akun Anda."
        />
        <LoadingState variant="form" label="Memuat profil" />
      </div>
    );
  }

  const p = profile || {};
  const avatarUrl = p.foto_profil || p.avatar || p.profile_image || null;
  const dosenPembimbingDisplay =
    p.dosen_pembimbing ||
    p.pembimbing ||
    [p.dosen_nama, p.dosen_nama_2].filter(Boolean).join(' / ') ||
    null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola informasi identitas, preferensi tampilan, dan keamanan akun Anda."
      />

      <div
        data-testid="profile-grid"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
      >
        {/* ===================== LEFT COLUMN: IDENTITY ===================== */}
        <div data-testid="profile-identity-col" className="space-y-6 min-w-0">
          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardContent className="pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative group w-fit shrink-0">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" className="object-cover" fill sizes="80px" />
                    ) : (
                      <span className="text-xl font-semibold font-mono text-[var(--text-strong)]">
                        {getInitials(p.nama)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label={uploading ? 'Mengunggah foto profil' : 'Unggah foto profil'}
                    className="absolute inset-0 min-h-11 min-w-11 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Camera className="h-5 w-5 text-white" aria-hidden="true" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="text-base font-semibold text-[var(--text-strong)] break-words">
                    {p.nama || '-'}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] break-all">{p.email || '-'}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface-sunken)] px-2 py-0.5 text-xs font-medium text-[var(--text-strong)]">
                      <Shield className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                      <span>{roleDisplay}</span>
                    </span>
                    <StatusBadge
                      status={p.is_active === false ? 'inactive' : 'active'}
                      label={p.is_active === false ? 'Nonaktif' : 'Aktif'}
                    />
                    {isMahasiswa && p.angkatan && (
                      <span className="inline-flex items-center rounded-md border border-[var(--line)] bg-[var(--surface-sunken)] px-2 py-0.5 text-xs font-mono tabular-nums text-[var(--text-muted)]">
                        {p.angkatan}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[var(--line)]">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                  <span>Informasi Profil</span>
                </CardTitle>
                <CardDescription>Data identitas dan kontak terdaftar pada akun Anda.</CardDescription>
              </div>
              {!editing ? (
                <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="shrink-0">
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Edit</span>
                </Button>
              ) : (
                <Button onClick={cancelEdit} variant="secondary" size="sm" className="shrink-0">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Batal</span>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <Field label="Nama Lengkap" required>
                    {(a11y) => (
                      <Input
                        {...a11y}
                        name="nama"
                        value={form.nama}
                        onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                        placeholder="Nama lengkap"
                      />
                    )}
                  </Field>
                  <Field label="Email" required>
                    {(a11y) => (
                      <Input
                        {...a11y}
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    )}
                  </Field>
                  {isMahasiswa && (
                    <Field label="No. WhatsApp">
                      {(a11y) => (
                        <Input
                          {...a11y}
                          name="no_wa"
                          value={form.no_wa}
                          onChange={(e) => setForm((f) => ({ ...f, no_wa: e.target.value }))}
                          placeholder="08xxxxxxxxxx"
                          className="font-mono tabular-nums"
                        />
                      )}
                    </Field>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4" aria-hidden="true" />
                      <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={Mail} label="Email" value={p.email} breakAll />
                  <InfoRow
                    icon={Hash}
                    label={isMahasiswa ? 'NPM' : 'NIDN'}
                    value={isMahasiswa ? p.npm : p.nidn}
                    mono
                  />
                  {isMahasiswa && (
                    <InfoRow icon={Phone} label="WhatsApp" value={p.no_wa || p.whatsapp} mono />
                  )}
                  {isMahasiswa && (
                    <InfoRow icon={Calendar} label="Angkatan" value={p.angkatan} mono />
                  )}
                  {isMahasiswa && (
                    <InfoRow icon={Briefcase} label="Track" value={p.track} />
                  )}
                  {isMahasiswa && (
                    <InfoRow icon={GraduationCap} label="Dosen Pembimbing" value={dosenPembimbingDisplay} />
                  )}
                  {!isMahasiswa && (
                    <InfoRow icon={Briefcase} label="Jabatan" value={roleDisplay} />
                  )}
                </dl>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===================== RIGHT COLUMN: SECURITY & PREFERENCES ===================== */}
        <div data-testid="profile-security-col" className="space-y-6 min-w-0">
          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Ubah Password</span>
              </CardTitle>
              <CardDescription>Perbarui password akun Anda secara berkala.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePw} className="space-y-4">
                <Field label="Password Lama" required>
                  {(a11y) => (
                    <Input
                      {...a11y}
                      name="oldPw"
                      type="password"
                      value={pwForm.oldPw}
                      onChange={(e) => setPwForm((f) => ({ ...f, oldPw: e.target.value }))}
                      placeholder="••••••••"
                    />
                  )}
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Password Baru" required hint="Minimal 6 karakter.">
                    {(a11y) => (
                      <Input
                        {...a11y}
                        name="newPw"
                        type="password"
                        value={pwForm.newPw}
                        onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                        placeholder="••••••••"
                      />
                    )}
                  </Field>
                  <Field label="Konfirmasi Password" required>
                    {(a11y) => (
                      <Input
                        {...a11y}
                        name="confirmPw"
                        type="password"
                        value={pwForm.confirmPw}
                        onChange={(e) => setPwForm((f) => ({ ...f, confirmPw: e.target.value }))}
                        placeholder="••••••••"
                      />
                    )}
                  </Field>
                </div>
                <Button type="submit" disabled={pwSaving}>
                  <Key className="h-4 w-4" aria-hidden="true" />
                  <span>{pwSaving ? 'Menyimpan...' : 'Ubah Password'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="text-base">Tampilan</CardTitle>
              <CardDescription>Pilih tema tampilan antarmuka aplikasi.</CardDescription>
            </CardHeader>
            <CardContent>
              {mounted && (
                <div className="grid grid-cols-2 gap-3" role="group" aria-label="Tema aplikasi">
                  {[
                    { id: 'light', label: 'Terang', icon: Sun },
                    { id: 'dark', label: 'Gelap', icon: Moon },
                  ].map(({ id, label, icon: Ic }) => {
                    const active = theme === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setTheme(id)}
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                            : 'border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text-body)] hover:text-[var(--text-strong)]'
                        }`}
                      >
                        <Ic className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="text-base">Sesi Akun</CardTitle>
              <CardDescription>Akhiri sesi Anda pada perangkat ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 items-center justify-between w-full rounded-lg border border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.08)] hover:bg-[hsl(var(--ctp-red)/0.14)] px-4 py-3 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LogOut className="h-4 w-4 text-[hsl(var(--ctp-red))] shrink-0" aria-hidden="true" />
                  <div className="text-left min-w-0">
                    <div className="text-sm font-semibold text-[hsl(var(--ctp-red))]">Keluar dari akun</div>
                    <div className="text-xs text-[var(--text-muted)]">Anda akan diminta login kembali.</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[hsl(var(--ctp-red))] shrink-0" aria-hidden="true" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false, breakAll = false }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-0.5">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </dt>
      <dd
        className={`text-sm font-medium text-[var(--text-strong)] ${
          mono ? 'font-mono tabular-nums' : ''
        } ${breakAll ? 'break-all' : 'break-words'}`}
      >
        {value || '-'}
      </dd>
    </div>
  );
}
