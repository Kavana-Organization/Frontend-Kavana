'use client';

import { useCallback, useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Phone, GraduationCap, Hash, Camera, Save,
  Shield, Briefcase, Calendar, Pencil, X, Key, Sun, Moon,
  LogOut, ChevronRight, Bell, BellOff, Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import Image from 'next/image';
import { authAPI, mahasiswaAPI, dosenAPI, koordinatorAPI, kaprodiAPI, uploadAPI } from '@/lib/api';

// ==============================
// CONSTANTS
// ==============================
const ROLE_LABELS = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen Pembimbing',
  koordinator: 'Koordinator',
  kaprodi: 'Kepala Program Studi',
  admin: 'Administrator',
};

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
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

// ==============================
// THEME HOOK (mirrors dashboard-layout)
// ==============================
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

// ==============================
// STYLES
// ==============================
const inputCls = "rounded-xl bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))] placeholder:text-[hsl(var(--ctp-overlay1))] focus-visible:ring-[hsl(var(--ctp-lavender)/0.5)]";
const labelCls = "text-sm font-medium text-[hsl(var(--ctp-subtext1))]";
const cardCls = "bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring";
const sectionTitleCls = "text-xs font-semibold uppercase tracking-wider text-[hsl(var(--ctp-subtext0))] mb-3";

// ==============================
// MAIN PAGE
// ==============================
export default function ProfilePage() {
  const router = useRouter();
  const { user, role, setUser, logout } = useAuthStore();
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

  useEffect(() => { loadProfile(); }, [role]);

  const loadProfile = async () => {
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
  };

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
        setProfile(prev => ({ ...prev, ...payload }));
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
    if (!file.type.startsWith('image/')) { toast.error('File harus berupa gambar'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Maksimal 2MB'); return; }

    setUploading(true);
    try {
      const res = await uploadAPI.uploadProfile(file);
      if (res.ok) {
        toast.success('Foto profil berhasil diupload!');
        await loadProfile();
      } else {
        toast.error('Gagal upload foto');
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      {/* ===================== PROFILE HEADER ===================== */}
      <Card className={`${cardCls} overflow-hidden`}>
        <div className="h-24 bg-gradient-to-r from-[hsl(var(--ctp-lavender)/0.25)] via-[hsl(var(--ctp-blue)/0.18)] to-[hsl(var(--ctp-teal)/0.20)]" />
        <CardContent className="-mt-12 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl border-4 border-[hsl(var(--ctp-surface0))] bg-[hsl(var(--ctp-surface1))] flex items-center justify-center overflow-hidden shadow-lg">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" className="object-cover" fill sizes="80px" />
                ) : (
                  <span className="text-xl font-bold text-[hsl(var(--ctp-lavender))]">
                    {getInitials(p.nama)}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label={uploading ? 'Mengunggah foto profil' : 'Unggah foto profil'}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Name & badges */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-[hsl(var(--ctp-text))]">{p.nama || '-'}</h2>
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">{p.email || '-'}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-[hsl(var(--ctp-lavender)/0.35)] bg-[hsl(var(--ctp-lavender)/0.12)] text-[hsl(var(--ctp-lavender))]">
                  <Shield className="w-3 h-3" />
                  {ROLE_LABELS[role] || role}
                </span>
                {isMahasiswa && p.angkatan && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-[hsl(var(--ctp-teal)/0.35)] bg-[hsl(var(--ctp-teal)/0.12)] text-[hsl(var(--ctp-teal))]">
                    {p.angkatan}
                  </span>
                )}
              </div>
            </div>

            {/* Edit toggle */}
            {!editing ? (
              <Button onClick={() => setEditing(true)} variant="secondary" className="ctp-focus rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)] text-[hsl(var(--ctp-text))] text-xs">
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            ) : (
              <Button onClick={cancelEdit} variant="secondary" className="ctp-focus rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)] text-[hsl(var(--ctp-text))] text-xs">
                <X className="w-3.5 h-3.5 mr-1.5" /> Batal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===================== SECTION: PROFIL / EDIT ===================== */}
      <div>
        <p className={sectionTitleCls}>Informasi Profil</p>
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className={cardCls}>
                <CardContent className="pt-6">
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={labelCls}>Nama Lengkap</Label>
                        <Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama lengkap" className={inputCls} />
                      </div>
                      <div className="space-y-2">
                        <Label className={labelCls}>Email</Label>
                        <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={inputCls} />
                      </div>
                    </div>
                    {isMahasiswa && (
                      <div className="space-y-2">
                        <Label className={labelCls}>No. WhatsApp</Label>
                        <Input value={form.no_wa} onChange={e => setForm(f => ({ ...f, no_wa: e.target.value }))} placeholder="08xxxxxxxxxx" className={inputCls} />
                      </div>
                    )}
                    <div className="flex gap-3 pt-1">
                      <Button type="submit" disabled={saving} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]">
                        <Save className="w-4 h-4 mr-2" />{saving ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className={cardCls}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={Mail} label="Email" value={p.email} />
                    <InfoRow icon={Hash} label={isMahasiswa ? 'NPM' : 'NIDN'} value={isMahasiswa ? p.npm : p.nidn} />
                    {isMahasiswa && <InfoRow icon={Phone} label="WhatsApp" value={p.no_wa || p.whatsapp} />}
                    {isMahasiswa && <InfoRow icon={Calendar} label="Angkatan" value={p.angkatan} />}
                    {isMahasiswa && <InfoRow icon={Briefcase} label="Track" value={p.track} />}
                    {isMahasiswa && <InfoRow icon={GraduationCap} label="Dosen Pembimbing" value={dosenPembimbingDisplay} />}
                    {!isMahasiswa && <InfoRow icon={Briefcase} label="Jabatan" value={ROLE_LABELS[role]} />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================== SECTION: TAMPILAN ===================== */}
      <div>
        <p className={sectionTitleCls}>Tampilan</p>
        <Card className={cardCls}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-[hsl(var(--ctp-text))]">Tema Aplikasi</div>
                <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Pilih tampilan yang nyaman untuk kamu.</div>
              </div>
            </div>
            {mounted && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { id: 'light', label: 'Terang', icon: Sun },
                  { id: 'dark', label: 'Gelap', icon: Moon },
                ].map(({ id, label, icon: Ic }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all cursor-pointer ${
                      theme === id
                        ? 'border-[hsl(var(--ctp-lavender)/0.6)] bg-[hsl(var(--ctp-lavender)/0.10)] text-[hsl(var(--ctp-lavender))]'
                        : 'border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] text-[hsl(var(--ctp-subtext0))] hover:bg-[hsl(var(--ctp-surface0)/0.35)]'
                    }`}
                  >
                    <Ic className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===================== SECTION: KEAMANAN ===================== */}
      <div>
        <p className={sectionTitleCls}>Keamanan</p>
        <Card className={cardCls}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-[hsl(var(--ctp-text))]">
              <Key className="h-4 w-4" /> Ubah Password
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Perbarui password akun Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePw} className="space-y-3">
              <div className="space-y-2">
                <Label className={labelCls}>Password Lama</Label>
                <Input type="password" value={pwForm.oldPw} onChange={e => setPwForm(f => ({ ...f, oldPw: e.target.value }))} className={inputCls} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className={labelCls}>Password Baru</Label>
                  <Input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} className={inputCls} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Konfirmasi</Label>
                  <Input type="password" value={pwForm.confirmPw} onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))} className={inputCls} placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" disabled={pwSaving} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]">
                <Key className="w-4 h-4 mr-2" />{pwSaving ? 'Menyimpan...' : 'Ubah Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ===================== SECTION: AKUN ===================== */}
      <div>
        <p className={sectionTitleCls}>Akun</p>
        <Card className={cardCls}>
          <CardContent className="pt-6">
            <button
              onClick={handleLogout}
              className="flex items-center justify-between w-full rounded-2xl border border-[hsl(var(--ctp-red)/0.25)] bg-[hsl(var(--ctp-red)/0.06)] hover:bg-[hsl(var(--ctp-red)/0.12)] p-3.5 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-[hsl(var(--ctp-red))]" />
                <div className="text-left">
                  <div className="text-sm font-medium text-[hsl(var(--ctp-red))]">Keluar dari akun</div>
                  <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Anda akan diminta login kembali.</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--ctp-red)/0.5)] group-hover:text-[hsl(var(--ctp-red))] transition-colors" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </motion.div>
  );
}

// ==============================
// INFO ROW COMPONENT
// ==============================
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.25)] bg-[hsl(var(--ctp-mantle)/0.30)] px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--ctp-subtext0))] mb-0.5">
        <Icon className="w-3 h-3" />{label}
      </div>
      <div className="text-sm font-medium text-[hsl(var(--ctp-text))]">{value || '-'}</div>
    </div>
  );
}

