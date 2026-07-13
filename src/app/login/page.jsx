'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import { GraduationCap, Eye, EyeOff, ArrowLeft, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/lib/api';
import { trackAuthEvent, trackAuthPageView } from '@/lib/auth-tracker';
import { useAuthStore } from '@/store/auth-store';
import { validateEmail, validateNPM } from '@/lib/validators';
import { ROLE_DASHBOARD_ROUTE } from '@/lib/constants';
import Script from 'next/script';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email atau NPM wajib diisi')
    .refine((value) => validateEmail(value) || validateNPM(value), 'Masukkan email yang valid atau NPM (angka)'),
  password: z.string().min(1, 'Password wajib diisi'),
});

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
  const {
    register,
    handleSubmit: handleFormSubmit,
    setError,
    clearErrors,
    formState: { errors: formErrors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileScriptLoaded, setTurnstileScriptLoaded] = useState(false);
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  useEffect(() => {
    trackAuthPageView('login');
  }, []);

  // Render the Turnstile widget once the script is loaded
  const renderTurnstile = useCallback(() => {
    if (
      !window.turnstile ||
      !turnstileContainerRef.current ||
      !TURNSTILE_SITE_KEY ||
      turnstileWidgetId.current !== null
    ) {
      return;
    }

    turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'auto',
      appearance: 'always',
      size: 'normal',
      callback: (token) => {
        setTurnstileToken(token);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.turnstile;
          return next;
        });
      },
      'expired-callback': () => {
        setTurnstileToken('');
      },
      'error-callback': () => {
        setTurnstileToken('');
        setErrors((prev) => ({ ...prev, turnstile: 'Verifikasi gagal. Silakan coba lagi.' }));
      },
    });
  }, []);

  useEffect(() => {
    if (turnstileScriptLoaded) {
      renderTurnstile();
    }
  }, [turnstileScriptLoaded, renderTurnstile]);

  // Clean up widget on unmount
  useEffect(() => {
    return () => {
      if (turnstileWidgetId.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch (_) { /* ignore */ }
        turnstileWidgetId.current = null;
      }
    };
  }, []);

  const resetTurnstile = useCallback(() => {
    if (turnstileWidgetId.current !== null && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId.current);
      setTurnstileToken('');
    }
  }, []);

  const handleSubmit = async ({ identifier: rawIdentifier, password }) => {
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrors((prev) => ({ ...prev, turnstile: 'Selesaikan verifikasi keamanan terlebih dahulu' }));
      return;
    }

    const identifier = rawIdentifier.trim();
    void trackAuthEvent('login_attempt', {
      identifier,
      auth_stage: 'submit',
    });

    setLoading(true);
    try {
      const result = await authAPI.login(
        identifier,
        password,
        turnstileToken || undefined
      );

      if (result.ok) {
        void trackAuthEvent('login_success', {
          identifier,
          auth_stage: 'submit',
        });

        storeLogin(result.data.token, result.data.role, result.data.user_id, result.data.roles || []);
        setUser({ nama: result.data.nama, email: result.data.email, roles: result.data.roles });

        toast.success('Login berhasil! Mengalihkan...');

        const role = result.data.role || 'mahasiswa';
        const dashboardUrl = ROLE_DASHBOARD_ROUTE[role] || ROLE_DASHBOARD_ROUTE.mahasiswa;

        setTimeout(() => {
          router.push(dashboardUrl);
        }, 500);
      } else {
        void trackAuthEvent('login_failed', {
          identifier,
          auth_stage: 'submit',
          failure_reason: result.error || `HTTP ${result.status || 'unknown'}`,
        });

        // Reset Turnstile on any login failure
        resetTurnstile();

        if (result.status === 403) {
          const isDeveloperDeviceError = /developer|device|token/i.test(result.error || '');
          if (isDeveloperDeviceError) {
            setError('identifier', { type: 'server', message: result.error || 'Device belum diizinkan untuk akun developer' });
            toast.error(result.error || 'Device belum diizinkan untuk akun developer');
          } else {
            setErrors((prev) => ({ ...prev, turnstile: result.error || 'Verifikasi keamanan gagal. Silakan coba lagi.' }));
            toast.error(result.error || 'Verifikasi keamanan gagal');
          }
        } else if (result.status === 401) {
          setError('password', { type: 'server', message: 'Email/NPM atau password salah' });
          toast.error('Email/NPM atau password salah');
        } else if (result.status === 404) {
          setError('identifier', { type: 'server', message: 'Akun tidak ditemukan' });
          toast.error('Akun tidak ditemukan');
        } else {
          toast.error(result.error || 'Login gagal. Silakan coba lagi.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      void trackAuthEvent('login_failed', {
        identifier,
        auth_stage: 'submit',
        failure_reason: 'network_error',
      });
      resetTurnstile();
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'h-12 rounded-xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] text-[hsl(var(--ctp-text))] placeholder:text-[hsl(var(--ctp-overlay1))] focus-visible:ring-[hsl(var(--ctp-blue)/0.2)] focus-visible:border-[hsl(var(--ctp-blue)/0.35)]';
  const errCls = 'border-[hsl(var(--ctp-red)/0.55)] focus-visible:ring-[hsl(var(--ctp-red)/0.2)]';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-8 sm:px-6 lg:px-8">
      {/* Load Cloudflare Turnstile script */}
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => {
            setTurnstileScriptLoaded(true);
            renderTurnstile();
          }}
          onReady={() => {
            setTurnstileScriptLoaded(true);
            renderTurnstile();
          }}
          onError={() => {
            setErrors((prev) => ({
              ...prev,
              turnstile: 'Captcha Cloudflare gagal dimuat. Periksa koneksi atau ad blocker.',
            }));
          }}
        />
      )}

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="soft-panel hidden rounded-2xl p-8 lg:block"
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
              <div key={item} className="flex items-start gap-3 rounded-xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-surface0))] p-4">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]">
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

          <Card className="rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))]">
            <CardHeader className="pb-1 pt-8 text-center">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--ctp-blue)/0.1)] text-[hsl(var(--ctp-blue))]">
                <GraduationCap className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-[hsl(var(--ctp-text))]">Masuk ke Kavana</CardTitle>
              <CardDescription className="mt-2 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">
                Gunakan email atau NPM untuk mengakses dashboard Anda.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8 sm:px-8">
              <form onSubmit={handleFormSubmit(handleSubmit)} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Email atau NPM</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="contoh@email.com atau 1234567890"
                    {...register('identifier', {
                      onChange: () => {
                        clearErrors('identifier');
                        setErrors((prev) => ({ ...prev, identifier: '' }));
                      },
                    })}
                    className={`${inputCls} ${formErrors.identifier || errors.identifier ? errCls : ''}`}
                    autoComplete="username"
                    aria-invalid={Boolean(formErrors.identifier || errors.identifier)}
                  />
                  {formErrors.identifier?.message || errors.identifier ? (
                    <p className="text-xs text-[hsl(var(--ctp-red))]">{formErrors.identifier?.message || errors.identifier}</p>
                  ) : null}
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
                      {...register('password', {
                        onChange: () => {
                          clearErrors('password');
                          setErrors((prev) => ({ ...prev, password: '' }));
                        },
                      })}
                      className={`${inputCls} pr-11 ${formErrors.password || errors.password ? errCls : ''}`}
                      autoComplete="current-password"
                      aria-invalid={Boolean(formErrors.password || errors.password)}
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
                  {formErrors.password?.message || errors.password ? (
                    <p className="text-xs text-[hsl(var(--ctp-red))]">{formErrors.password?.message || errors.password}</p>
                  ) : null}
                </div>

                {/* Cloudflare Turnstile Widget */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--ctp-subtext1))]">
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--ctp-blue))]" />
                    Verifikasi Keamanan
                  </Label>

                  <div
                    className={`rounded-xl border bg-[hsl(var(--ctp-surface0))] px-4 py-3 ${
                      errors.turnstile
                        ? 'border-[hsl(var(--ctp-red)/0.55)]'
                        : 'border-[hsl(var(--ctp-surface1))]'
                    }`}
                  >
                    {TURNSTILE_SITE_KEY ? (
                      <>
                        <div
                          ref={turnstileContainerRef}
                          id="turnstile-widget"
                          className="flex min-h-[74px] items-center justify-center"
                        />
                        {!turnstileScriptLoaded ? (
                          <p className="text-center text-xs text-[hsl(var(--ctp-overlay1))]">
                            Memuat captcha Cloudflare...
                          </p>
                        ) : null}
                        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ctp-overlay1))]">
                          Dilindungi oleh Cloudflare Turnstile
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-3 text-xs text-[hsl(var(--ctp-overlay1))]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>
                          Captcha nonaktif — atur{' '}
                          <code className="rounded bg-[hsl(var(--ctp-surface1)/0.6)] px-1 py-0.5 text-[hsl(var(--ctp-text))]">
                            NEXT_PUBLIC_TURNSTILE_SITE_KEY
                          </code>{' '}
                          di <code className="rounded bg-[hsl(var(--ctp-surface1)/0.6)] px-1 py-0.5 text-[hsl(var(--ctp-text))]">.env.local</code>
                        </span>
                      </div>
                    )}
                  </div>
                  {errors.turnstile ? (
                    <p className="text-xs text-center text-[hsl(var(--ctp-red))]">{errors.turnstile}</p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                  size="lg"
                  disabled={loading || (TURNSTILE_SITE_KEY && !turnstileToken)}
                >
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

              <div className="rounded-xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-surface0))] p-4 text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">
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
