'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Key, Sun, Moon, LogOut, ChevronRight, Palette,
  Eye, EyeOff, ShieldCheck, Shield, User,
} from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useAuthStore } from '@/store/auth-store';
import { authAPI } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/constants';

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

export default function SettingsPage() {
  const router = useRouter();
  const { user, role, logout } = useAuthStore();
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
    if (!oldPw || !newPw) { toast.error('Semua field wajib diisi'); return; }
    if (newPw !== confirmPw) { toast.error('Konfirmasi password tidak cocok'); return; }
    if (newPw.length < 8) { toast.error('Password minimal 8 karakter'); return; }

    setPwSaving(true);
    try {
      const res = await authAPI.changePassword(oldPw, newPw);
      if (res.ok) {
        toast.success('Password berhasil diubah');
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

  const roleDisplay = ROLE_LABEL[role] || role || '-';
  const identifier = user?.npm || user?.nidn || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola preferensi tampilan, keamanan, dan sesi akun Anda."
      />

      <div
        data-testid="settings-grid"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
      >
        {/* ===================== LEFT COLUMN: IDENTITY & APPEARANCE ===================== */}
        <div data-testid="settings-identity-col" className="space-y-6 min-w-0">
          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Identitas Akun</span>
              </CardTitle>
              <CardDescription>Informasi akun yang sedang aktif pada sesi ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 min-w-0">
                  <dt className="text-xs text-[var(--text-muted)] mb-0.5">Nama Pengguna</dt>
                  <dd className="text-sm font-medium text-[var(--text-strong)] break-words">
                    {user?.nama || '-'}
                  </dd>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 min-w-0">
                  <dt className="text-xs text-[var(--text-muted)] mb-0.5">Email</dt>
                  <dd className="text-sm font-medium text-[var(--text-strong)] break-all">
                    {user?.email || '-'}
                  </dd>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 min-w-0">
                  <dt className="text-xs text-[var(--text-muted)] mb-0.5">Peran</dt>
                  <dd className="text-sm font-medium text-[var(--text-strong)] flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                    <span>{roleDisplay}</span>
                  </dd>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 min-w-0">
                  <dt className="text-xs text-[var(--text-muted)] mb-0.5">
                    {role === 'mahasiswa' ? 'NPM' : identifier ? 'NIDN / ID' : 'Status Sesi'}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--text-strong)] font-mono tabular-nums">
                    {identifier || <StatusBadge status="active" label="Sesi Aktif" />}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {role !== 'admin' && role !== 'developer' && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/profile">Lihat Profil Lengkap</Link>
                  </Button>
                )}
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/support">Pusat Bantuan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Tampilan</span>
              </CardTitle>
              <CardDescription>Pilih tampilan yang nyaman untuk sesi kerja Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              {mounted && (
                <div className="grid grid-cols-2 gap-3" role="group" aria-label="Tema aplikasi">
                  {[
                    { id: 'light', label: 'Terang', icon: Sun, desc: 'Mode terang' },
                    { id: 'dark', label: 'Gelap', icon: Moon, desc: 'Mode gelap' },
                  ].map(({ id, label, icon: Ic, desc }) => {
                    const active = theme === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setTheme(id)}
                        className={`flex min-h-11 flex-col items-center gap-1 rounded-lg border p-3.5 transition-colors cursor-pointer ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                            : 'border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text-body)] hover:text-[var(--text-strong)]'
                        }`}
                      >
                        <Ic className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="text-xs font-semibold">{label}</span>
                        <span className="text-xs text-[var(--text-muted)]">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===================== RIGHT COLUMN: SECURITY & SESSION ===================== */}
        <div data-testid="settings-security-col" className="space-y-6 min-w-0">
          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Ubah Password</span>
              </CardTitle>
              <CardDescription>Perbarui password akun Anda untuk menjaga keamanan akses.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePw} className="space-y-4">
                <Field label="Password Lama" required>
                  {(a11y) => (
                    <div className="relative">
                      <Input
                        {...a11y}
                        name="oldPw"
                        type={showOldPw ? 'text' : 'password'}
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        className="pr-11"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPw(!showOldPw)}
                        aria-label={showOldPw ? 'Sembunyikan password lama' : 'Tampilkan password lama'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors cursor-pointer"
                      >
                        {showOldPw ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                  )}
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Password Baru" required>
                    {(a11y) => (
                      <div className="relative">
                        <Input
                          {...a11y}
                          name="newPw"
                          type={showNewPw ? 'text' : 'password'}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          className="pr-11"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          aria-label={showNewPw ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
                          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors cursor-pointer"
                        >
                          {showNewPw ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    )}
                  </Field>

                  <Field label="Konfirmasi Password Baru" required>
                    {(a11y) => (
                      <Input
                        {...a11y}
                        name="confirmPw"
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="••••••••"
                      />
                    )}
                  </Field>
                </div>

                {newPw && (
                  <div className="text-xs text-[var(--text-muted)]" aria-live="polite">
                    {newPw.length < 6 ? (
                      <span className="text-[hsl(var(--ctp-red))]">Minimal 6 karakter</span>
                    ) : newPw.length < 10 ? (
                      <span className="text-[hsl(var(--ctp-peach))]">Cukup kuat</span>
                    ) : (
                      <span className="text-[hsl(var(--ctp-green))]">Password kuat</span>
                    )}
                    {newPw && confirmPw && newPw !== confirmPw && (
                      <span className="text-[hsl(var(--ctp-red))] ml-3">Konfirmasi tidak cocok</span>
                    )}
                  </div>
                )}

                <Button type="submit" disabled={pwSaving}>
                  <Key className="h-4 w-4" aria-hidden="true" />
                  <span>{pwSaving ? 'Menyimpan...' : 'Ubah Password'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card variant="muted" className="bg-[var(--surface-raised)]">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="flex items-center gap-2 text-base">
                <LogOut className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Sesi Akun</span>
              </CardTitle>
              <CardDescription>Keluar dari sesi aktif di browser ini.</CardDescription>
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
