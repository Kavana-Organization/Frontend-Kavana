'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import { GraduationCap, Eye, EyeOff, ArrowLeft, LogIn, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { authAPI } from '@/lib/api';
import { trackAuthEvent, trackAuthPageView } from '@/lib/auth-tracker';
import { useAuthStore } from '@/store/auth-store';
import { validateEmail, validateNPM } from '@/lib/validators';
import { ROLE_DASHBOARD_ROUTE } from '@/lib/constants';
import { cn } from '@/lib/utils';
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
    'h-11 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]';
  const errCls = 'border-[hsl(var(--ctp-red))] focus-visible:ring-[hsl(var(--ctp-red))]';

  return (
    <div className="min-h-screen bg-[var(--surface-page)] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
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

      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.1fr_400px]">
        {/* Left Column: Institutional Panel (Visible on lg) */}
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-8 lg:block"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <div className="mt-8 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-md border border-[hsl(var(--ctp-blue)/0.2)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              <Sparkles className="h-3.5 w-3.5" />
              Portal Akademik D4TI ULBI
            </span>
            <p className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-strong)]">
              Masuk ke ruang kerja bimbingan tanpa tampilan yang melelahkan.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-body)]">
              Fokus utama Kavanahub adalah membantu pengguna melihat apa yang penting lebih cepat:
              progres, dokumen, dan tindak lanjut yang masih menunggu.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-3.5"
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <p className="text-xs leading-relaxed text-[var(--text-body)]">{item}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Right Column: Centered Form Column (max-w-[400px]) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[400px] mx-auto"
        >
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] lg:hidden [@media(pointer:coarse)]:min-h-11"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <Card className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
            <CardHeader className="pb-2 pt-6 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
                <h1 className="leading-8">Masuk ke Kavana</h1>
              </CardTitle>
              <CardDescription className="mt-1.5 text-xs text-[var(--text-muted)]">
                Gunakan email atau NPM untuk mengakses dashboard Anda.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-2">
              <form onSubmit={handleFormSubmit(handleSubmit)} className="space-y-4" noValidate>
                <Field
                  id="identifier"
                  label="Email atau NPM"
                  error={formErrors.identifier?.message || errors.identifier}
                >
                  <Input
                    id="identifier"
                    data-testid="login-email"
                    type="text"
                    placeholder="contoh@email.com atau 1234567890"
                    {...register('identifier', {
                      onChange: () => {
                        clearErrors('identifier');
                        setErrors((prev) => ({ ...prev, identifier: '' }));
                      },
                    })}
                    className={cn(inputCls, (formErrors.identifier || errors.identifier) && errCls)}
                    autoComplete="username"
                  />
                </Field>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="password" className="text-sm font-medium text-[var(--text-strong)]">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="inline-flex items-center text-xs font-medium text-[var(--accent)] hover:underline transition-colors [@media(pointer:coarse)]:min-h-11"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <Field
                    id="password"
                    error={formErrors.password?.message || errors.password}
                  >
                    {(a11y) => (
                      <div className="relative">
                        <Input
                          {...a11y}
                          data-testid="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Masukkan password"
                          {...register('password', {
                            onChange: () => {
                              clearErrors('password');
                              setErrors((prev) => ({ ...prev, password: '' }));
                            },
                          })}
                          className={cn(
                            inputCls,
                            'pr-10',
                            (formErrors.password || errors.password) && errCls
                          )}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors [@media(pointer:coarse)]:right-0.5 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </Field>
                </div>

                {/* Developer Device Section (always visible on desktop and mobile) */}
                <div
                  data-testid="developer-device-section"
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-body)]"
                >
                  <span className="inline-flex items-center gap-2 font-medium">
                    <KeyRound className="h-4 w-4 text-[var(--accent)]" />
                    Device developer
                  </span>
                  <span className="text-right text-[var(--text-muted)]">Device lock aktif</span>
                </div>

                {/* Cloudflare Turnstile Widget */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-strong)]">
                    <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                    Verifikasi Keamanan
                  </label>

                  <div
                    className={cn(
                      'rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5',
                      errors.turnstile ? 'border-[hsl(var(--ctp-red))]' : 'border-[var(--line)]'
                    )}
                  >
                    {TURNSTILE_SITE_KEY ? (
                      <>
                        <div
                          ref={turnstileContainerRef}
                          id="turnstile-widget"
                          className="flex min-h-[74px] items-center justify-center"
                        />
                        {!turnstileScriptLoaded && (
                          <p className="text-center text-xs text-[var(--text-muted)]">
                            Memuat captcha Cloudflare...
                          </p>
                        )}
                        <p className="mt-1.5 text-center text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          Dilindungi oleh Cloudflare Turnstile
                        </p>
                      </>
                    ) : (
                      <div
                        data-testid="turnstile-fallback"
                        aria-live="polite"
                        className="flex items-center justify-center gap-2 py-2 text-center text-xs text-[var(--text-muted)]"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                        <span>
                          Verifikasi keamanan belum tersedia. Muat ulang halaman atau hubungi admin.
                        </span>
                      </div>
                    )}
                  </div>
                  {errors.turnstile && (
                    <p role="alert" className="text-center text-xs font-medium text-[hsl(var(--ctp-red))]">
                      {errors.turnstile}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  data-testid="login-submit"
                  className="h-11 w-full text-sm font-medium rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[hsl(var(--ctp-blue)/0.9)] transition-colors"
                  disabled={loading || (TURNSTILE_SITE_KEY && !turnstileToken)}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
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

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--line)]" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  akun baru
                </span>
                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-3 text-center text-xs leading-relaxed text-[var(--text-body)]">
                Belum punya akun?{' '}
                <Link
                  href="/register"
                  className="inline-flex items-center font-medium text-[var(--accent)] hover:underline transition-colors [@media(pointer:coarse)]:min-h-11"
                >
                  Daftar sekarang
                </Link>{' '}
                untuk mulai mengelola proses bimbingan Anda.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
