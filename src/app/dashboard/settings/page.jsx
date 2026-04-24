'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key, Sun, Moon, LogOut, ChevronRight, Palette,
  Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { useAuthStore } from '@/store/auth-store';
import { authAPI } from '@/lib/api';

// ==============================
// THEME HOOK
// ==============================
function useIsHydrated() {
  return useSyncExternalStore(
    () => () => { },
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
export default function SettingsPage() {
  const router = useRouter();
  const { role, logout } = useAuthStore();
  const { theme, setTheme, mounted } = useThemeLocal();

  // Password form
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!oldPw || !newPw) { toast.error('Field wajib diisi'); return; }
    if (newPw !== confirmPw) { toast.error('Konfirmasi password tidak cocok'); return; }
    if (newPw.length < 6) { toast.error('Password minimal 6 karakter'); return; }

    setPwSaving(true);
    try {
      const res = await authAPI.changePassword(oldPw, newPw);
      if (res.ok) {
        toast.success('Password berhasil diubah!');
        setOldPw(''); setNewPw(''); setConfirmPw('');
      } else {
        toast.error(res.error || 'Gagal mengubah password');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Berhasil logout');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <PageHeader title="Pengaturan" subtitle="Kelola pengaturan akun Anda." />

      {/* ===================== TAMPILAN ===================== */}
      <div>
        <p className={sectionTitleCls}>
          <Palette className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Tampilan
        </p>
        <Card className={cardCls}>
          <CardContent className="pt-6">
            <div className="mb-2">
              <div className="text-sm font-medium text-[hsl(var(--ctp-text))]">Tema Aplikasi</div>
              <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Pilih tampilan yang nyaman untuk kamu.</div>
            </div>
            {mounted && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { id: 'light', label: 'Terang', icon: Sun, desc: 'Mode terang' },
                  { id: 'dark', label: 'Gelap', icon: Moon, desc: 'Mode gelap' },
                ].map(({ id, label, icon: Ic, desc }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 transition-all cursor-pointer ${
                      theme === id
                        ? 'border-[hsl(var(--ctp-lavender)/0.6)] bg-[hsl(var(--ctp-lavender)/0.10)] text-[hsl(var(--ctp-lavender))] shadow-sm shadow-[hsl(var(--ctp-lavender)/0.1)]'
                        : 'border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] text-[hsl(var(--ctp-subtext0))] hover:bg-[hsl(var(--ctp-surface0)/0.35)]'
                    }`}
                  >
                    <Ic className="w-5 h-5" />
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===================== KEAMANAN ===================== */}
      <div>
        <p className={sectionTitleCls}>
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Keamanan
        </p>
        <Card className={cardCls}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-[hsl(var(--ctp-text))]">
              <Key className="h-4 w-4" /> Ubah Password
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Perbarui password akun Anda untuk keamanan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePw} className="space-y-3">
              {/* Old password */}
              <div className="space-y-2">
                <Label className={labelCls}>Password Lama</Label>
                <div className="relative">
                  <Input
                    type={showOldPw ? 'text' : 'password'}
                    value={oldPw}
                    onChange={e => setOldPw(e.target.value)}
                    className={`${inputCls} pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPw(!showOldPw)}
                    aria-label={showOldPw ? 'Sembunyikan password lama' : 'Tampilkan password lama'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ctp-overlay1))] hover:text-[hsl(var(--ctp-text))] transition-colors"
                  >
                    {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password + confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className={labelCls}>Password Baru</Label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      className={`${inputCls} pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      aria-label={showNewPw ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ctp-overlay1))] hover:text-[hsl(var(--ctp-text))] transition-colors"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Konfirmasi Password Baru</Label>
                  <Input
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className={inputCls}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Password strength hint */}
              {newPw && (
                <div className="text-xs text-[hsl(var(--ctp-subtext0))]">
                  {newPw.length < 6
                    ? <span className="text-[hsl(var(--ctp-red))]">⚠ Minimal 6 karakter</span>
                    : newPw.length < 10
                      ? <span className="text-[hsl(var(--ctp-peach))]">● Cukup kuat</span>
                      : <span className="text-[hsl(var(--ctp-green))]">● Password kuat</span>
                  }
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <span className="text-[hsl(var(--ctp-red))] ml-3">⚠ Tidak cocok</span>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={pwSaving}
                className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]"
              >
                <Key className="w-4 h-4 mr-2" />{pwSaving ? 'Menyimpan...' : 'Ubah Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ===================== AKUN ===================== */}
      <div>
        <p className={sectionTitleCls}>
          <LogOut className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Akun
        </p>
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

      <div className="h-4" />
    </motion.div>
  );
}
