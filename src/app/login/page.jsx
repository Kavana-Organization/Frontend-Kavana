'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GraduationCap, Eye, EyeOff, ArrowLeft, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { validateEmail, validateNPM } from '@/lib/validators';
import { ROLE_DASHBOARD_ROUTE } from '@/lib/constants';

const highlights = [
  'Riwayat bimbingan tersimpan rapi dalam satu akun.',
  'Status proposal, laporan, dan jadwal lebih mudah dipantau.',
  'Mahasiswa, dosen, dan pengelola bekerja di alur yang sama.',
];

export default function LoginPage() {
  const router = useRouter();
  const { login: storeLogin, setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ identifier: '', password: '' });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    const { identifier, password } = formData;

    if (!identifier.trim()) {
      errs.identifier = 'Email atau NPM wajib diisi';
    } else if (!validateEmail(identifier.trim()) && !validateNPM(identifier.trim())) {
      errs.identifier = 'Masukkan email yang valid atau NPM (angka)';
    }

    if (!password) {
      errs.password = 'Password wajib diisi';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await authAPI.login(formData.identifier.trim(), formData.password);

      if (result.ok) {
        storeLogin(result.data.token, result.data.role, result.data.user_id, result.data.roles || []);
        setUser({ nama: result.data.nama, email: result.data.email, roles: result.data.roles });

        toast.success('Login berhasil! Mengalihkan...');

        const role = result.data.role || 'mahasiswa';
        const dashboardUrl = ROLE_DASHBOARD_ROUTE[role] || ROLE_DASHBOARD_ROUTE.mahasiswa;

        setTimeout(() => {
          router.push(dashboardUrl);
        }, 500);
      } else {
        if (result.status === 401) {
          setErrors({ password: 'Email/NPM atau password salah' });
          toast.error('Email/NPM atau password salah');
        } else if (result.status === 404) {
          setErrors({ identifier: 'Akun tidak ditemukan' });
          toast.error('Akun tidak ditemukan');
        } else {
          toast.error(result.error || 'Login gagal. Silakan coba lagi.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'h-12 rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.84)] text-[hsl(var(--ctp-text))] placeholder:text-[hsl(var(--ctp-overlay1))] focus-visible:ring-[hsl(var(--ctp-blue)/0.2)] focus-visible:border-[hsl(var(--ctp-blue)/0.35)]';
  const errCls = 'border-[hsl(var(--ctp-red)/0.55)] focus-visible:ring-[hsl(var(--ctp-red)/0.2)]';

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--ctp-sky)/0.18),transparent_28%),radial-gradient(circle_at_bottom_right,hsl(var(--ctp-lavender)/0.18),transparent_24%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="soft-panel hidden rounded-[36px] p-8 lg:block"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--ctp-subtext1))] transition-colors hover:text-[hsl(var(--ctp-blue))]">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <div className="mt-10 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ctp-blue)/0.2)] bg-[hsl(var(--ctp-blue)/0.08)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--ctp-blue))]">
              <Sparkles className="h-3.5 w-3.5" />
              Portal Akademik yang Lebih Tertata
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-[hsl(var(--ctp-text))]">
              Masuk ke ruang kerja bimbingan tanpa tampilan yang melelahkan.
            </h1>
            <p className="mt-5 text-base leading-8 text-[hsl(var(--ctp-subtext1))]">
              Fokus utama Kavanahub adalah membantu pengguna melihat apa yang penting lebih cepat:
              progres, dokumen, dan tindak lanjut yang masih menunggu.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[24px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.72)] p-4">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <p className="text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">{item}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full max-w-xl justify-self-center"
        >
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--ctp-subtext1))] transition-colors hover:text-[hsl(var(--ctp-blue))] lg:hidden">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <Card className="rounded-[32px] border-[hsl(var(--ctp-surface1)/0.9)] bg-[hsl(var(--ctp-base)/0.84)]">
            <CardHeader className="pb-1 pt-8 text-center">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,hsl(var(--ctp-blue)/0.2),hsl(var(--ctp-teal)/0.16))] text-[hsl(var(--ctp-blue))]">
                <GraduationCap className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-[hsl(var(--ctp-text))]">Masuk ke Kavana</CardTitle>
              <CardDescription className="mt-2 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">
                Gunakan email atau NPM untuk mengakses dashboard Anda.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Email atau NPM</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="contoh@email.com atau 1234567890"
                    value={formData.identifier}
                    onChange={handleChange('identifier')}
                    className={`${inputCls} ${errors.identifier ? errCls : ''}`}
                    autoComplete="username"
                  />
                  {errors.identifier ? <p className="text-xs text-[hsl(var(--ctp-red))]">{errors.identifier}</p> : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Password</Label>
                    <Link href="/forgot-password" className="text-xs font-semibold text-[hsl(var(--ctp-blue))] transition-colors hover:text-[hsl(var(--ctp-teal))]">
                      Lupa password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      value={formData.password}
                      onChange={handleChange('password')}
                      className={`${inputCls} pr-11 ${errors.password ? errCls : ''}`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ctp-overlay1))] transition-colors hover:text-[hsl(var(--ctp-subtext1))]"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? <p className="text-xs text-[hsl(var(--ctp-red))]">{errors.password}</p> : null}
                </div>

                <Button type="submit" className="h-12 w-full text-base" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      Masuk...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Masuk
                    </span>
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[hsl(var(--ctp-surface1))]" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[hsl(var(--ctp-overlay1))]">akun baru</span>
                <div className="h-px flex-1 bg-[hsl(var(--ctp-surface1))]" />
              </div>

              <div className="rounded-[24px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-crust)/0.68)] p-4 text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">
                Belum punya akun?{' '}
                <Link href="/register" className="font-semibold text-[hsl(var(--ctp-blue))] transition-colors hover:text-[hsl(var(--ctp-teal))]">
                  Daftar sekarang
                </Link>
                {' '}untuk mulai mengelola proses bimbingan Anda.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
