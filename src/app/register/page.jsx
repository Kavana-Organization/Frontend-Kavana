'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  UserPlus,
  Check,
  X as XIcon,
  ShieldCheck,
  ClipboardList,
  RotateCcw,
  LoaderCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { authAPI } from '@/lib/api';
import { trackAuthEvent, trackAuthPageView } from '@/lib/auth-tracker';
import { validateRegisterEmail, validateNPM, validateWhatsApp, validatePassword } from '@/lib/validators';
import { cn } from '@/lib/utils';

const registerSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama lengkap wajib diisi').min(3, 'Nama minimal 3 karakter'),
    npm: z.string().trim().min(1, 'NPM wajib diisi').refine(validateNPM, 'NPM harus berupa angka'),
    angkatan: z.string().min(1, 'Pilih angkatan'),
    jalur: z.enum(['regular', 'rpl']),
    email: z.string().trim().superRefine((value, context) => {
      const result = validateRegisterEmail(value);
      if (!result.valid) {
        context.addIssue({ code: 'custom', message: result.error });
      }
    }),
    whatsapp: z
      .string()
      .trim()
      .min(1, 'Nomor WhatsApp wajib diisi')
      .refine(validateWhatsApp, 'Format nomor tidak valid (contoh: 08123456789)'),
    password: z
      .string()
      .min(1, 'Password wajib diisi')
      .refine((value) => validatePassword(value).isValid, 'Password belum memenuhi persyaratan'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    terms: z.boolean().refine(Boolean, 'Anda harus menyetujui syarat dan ketentuan'),
  })
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Password tidak cocok',
      });
    }
  });

function OTPInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);

  const handleChange = (i, e) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;
    const newOtp = value.split('');
    newOtp[i] = val.slice(-1);
    const joined = newOtp.join('');
    onChange(joined);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, ''));
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          name={`otp-${i}`}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          aria-label={`Digit OTP ${i + 1}`}
          autoComplete="one-time-code"
          className="h-12 w-11 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] text-center text-xl font-mono tabular-nums font-semibold text-[var(--text-strong)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
        />
      ))}
    </div>
  );
}

function getAngkatanOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const newestAngkatan = currentMonth >= 10 ? currentYear : currentYear - 1;
  const options = [];
  for (let year = newestAngkatan; year >= newestAngkatan - 3; year--) {
    options.push(year.toString());
  }
  return options;
}

const registerBenefits = [
  {
    title: 'Data akademik lebih rapi',
    description: 'Informasi pengguna dan proses bimbingan tersimpan dalam satu sistem.',
    icon: ShieldCheck,
  },
  {
    title: 'Status mudah dipantau',
    description: 'Mahasiswa dapat melihat status pengajuan dan perkembangan proses akademik.',
    icon: ClipboardList,
  },
  {
    title: 'Proses lebih terstruktur',
    description: 'Setiap tahapan bimbingan mengikuti alur yang jelas dan terdokumentasi.',
    icon: CheckCircle2,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit: handleFormSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nama: '',
      npm: '',
      angkatan: '',
      jalur: 'regular',
      email: '',
      whatsapp: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });
  const formData = watch();

  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const angkatanOptions = useMemo(() => getAngkatanOptions(), []);
  const passwordCheck = useMemo(() => validatePassword(formData.password), [formData.password]);

  useEffect(() => {
    trackAuthPageView('register');
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (data) => {
    const identifier = data.email.trim() || data.npm.trim();
    void trackAuthEvent('register_attempt', {
      identifier,
      auth_stage: 'request_otp',
    });

    setLoading(true);
    try {
      const result = await authAPI.requestRegisterOTP({
        nama: data.nama.trim(),
        npm: data.npm.trim(),
        angkatan: parseInt(data.angkatan),
        jalur: data.jalur,
        email: data.email.trim(),
        no_wa: data.whatsapp.trim(),
        password: data.password,
      });

      if (result.ok) {
        void trackAuthEvent('register_otp_sent', {
          identifier,
          auth_stage: 'request_otp',
        });
        toast.success('Kode OTP telah dikirim ke email Anda!');
        setCountdown(result.data.expires_in || 300);
        setStep('otp');
      } else {
        void trackAuthEvent('register_failed', {
          identifier,
          auth_stage: 'request_otp',
          failure_reason: result.error || `HTTP ${result.status || 'unknown'}`,
        });
        const errorLower = (result.error || '').toLowerCase();
        if (errorLower.includes('email') && (errorLower.includes('sudah') || errorLower.includes('already'))) {
          setError('email', { type: 'server', message: 'Email sudah terdaftar' });
          toast.error('Email sudah terdaftar');
        } else if (errorLower.includes('npm') && (errorLower.includes('sudah') || errorLower.includes('already'))) {
          setError('npm', { type: 'server', message: 'NPM sudah terdaftar' });
          toast.error('NPM sudah terdaftar');
        } else {
          toast.error(result.error || 'Gagal mengirim OTP. Silakan coba lagi.');
        }
      }
    } catch (err) {
      console.error('Registration OTP error:', err);
      void trackAuthEvent('register_failed', {
        identifier,
        auth_stage: 'request_otp',
        failure_reason: 'network_error',
      });
      toast.error('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidSubmit = (formErrors) => {
    if (formErrors.confirmPassword?.message === 'Password tidak cocok') {
      toast.error('Konfirmasi password tidak sesuai.');
      return;
    }
    toast.error('Mohon lengkapi data pendaftaran yang masih belum valid.');
  };

  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    setLoading(true);
    const identifier = formData.email.trim() || formData.npm.trim();
    void trackAuthEvent('register_attempt', {
      identifier,
      auth_stage: 'verify_otp',
    });

    try {
      const result = await authAPI.verifyRegisterOTP(formData.email.trim(), otp);
      if (result.ok) {
        void trackAuthEvent('register_success', {
          identifier,
          auth_stage: 'verify_otp',
        });
        toast.success('Registrasi berhasil!');
        setStep('success');
      } else {
        void trackAuthEvent('register_failed', {
          identifier,
          auth_stage: 'verify_otp',
          failure_reason: result.error || result.data?.message || `HTTP ${result.status || 'unknown'}`,
        });
        toast.error(result.error || result.data?.message || 'Kode OTP tidak valid');
      }
    } catch {
      void trackAuthEvent('register_failed', {
        identifier,
        auth_stage: 'verify_otp',
        failure_reason: 'network_error',
      });
      toast.error('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp('');
    setLoading(true);
    const identifier = formData.email.trim() || formData.npm.trim();
    try {
      const result = await authAPI.requestRegisterOTP({
        nama: formData.nama.trim(),
        npm: formData.npm.trim(),
        angkatan: parseInt(formData.angkatan),
        jalur: formData.jalur,
        email: formData.email.trim(),
        no_wa: formData.whatsapp.trim(),
        password: formData.password,
      });
      if (result.ok) {
        void trackAuthEvent('register_otp_resend', {
          identifier,
          auth_stage: 'resend_otp',
        });
        toast.success('Kode OTP baru telah dikirim!');
        setCountdown(result.data.expires_in || 300);
      } else {
        void trackAuthEvent('register_failed', {
          identifier,
          auth_stage: 'resend_otp',
          failure_reason: result.error || `HTTP ${result.status || 'unknown'}`,
        });
        toast.error(result.error || 'Gagal mengirim ulang OTP');
      }
    } catch {
      void trackAuthEvent('register_failed', {
        identifier,
        auth_stage: 'resend_otp',
        failure_reason: 'network_error',
      });
      toast.error('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const inputCls =
    'h-11 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]';
  const errCls = 'border-[hsl(var(--ctp-red))] focus-visible:ring-[hsl(var(--ctp-red))]';

  const PasswordReq = ({ met, text }) => (
    <span className={cn('flex items-center gap-1.5 text-xs font-medium', met ? 'text-[hsl(var(--ctp-green))]' : 'text-[var(--text-muted)]')}>
      {met ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
      {text}
    </span>
  );

  const stepVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--surface-page)] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-12 lg:grid-cols-[1.1fr_500px]">
          {/* Left Column: Institutional Panel */}
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
                <GraduationCap className="h-4 w-4" />
                Portal Akademik D4TI ULBI
              </span>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-strong)]">
                Buat akun untuk mulai mengelola proses bimbingan akademik.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-body)]">
                Melalui akun Kavana, mahasiswa dapat mengajukan proposal, mengikuti proses validasi,
                mencatat bimbingan, dan memantau progress akademik dalam satu sistem.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {registerBenefits.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-3.5"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-semibold text-[var(--text-strong)]">{title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-[var(--text-body)]">{description}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Right Column: Centered Form Column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[500px] mx-auto"
          >
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>

            <Card className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
              <CardHeader className="pb-2 pt-6 text-center">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  {step === 'success' ? (
                    <CheckCircle2 className="h-6 w-6 text-[hsl(var(--ctp-green))]" />
                  ) : step === 'otp' ? (
                    <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
                  ) : (
                    <GraduationCap className="h-6 w-6 text-[var(--accent)]" />
                  )}
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
                  {step === 'success' ? 'Registrasi Berhasil' : step === 'otp' ? 'Verifikasi Email' : 'Daftar Akun Baru'}
                </CardTitle>
                <CardDescription className="mt-1.5 text-xs text-[var(--text-muted)]">
                  {step === 'success'
                    ? 'Akun Anda sudah siap digunakan.'
                    : step === 'otp'
                      ? `Masukkan kode 6 digit yang dikirim ke ${formData.email}`
                      : 'Lengkapi data berikut untuk mulai menggunakan Kavana sebagai sistem bimbingan akademik.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6 pt-2">
                <AnimatePresence mode="wait">
                  {step === 'form' && (
                    <motion.form
                      key="form"
                      {...stepVariants}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleFormSubmit(handleSubmit, handleInvalidSubmit)}
                      noValidate
                      className="space-y-4"
                    >
                      <Field id="nama" label="Nama Lengkap" error={errors.nama?.message}>
                        <Input
                          id="nama"
                          placeholder="Masukkan nama lengkap"
                          {...register('nama')}
                          className={cn(inputCls, errors.nama && errCls)}
                          autoComplete="name"
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="npm" label="NPM" error={errors.npm?.message}>
                          <Input
                            id="npm"
                            placeholder="1234567890"
                            inputMode="numeric"
                            {...register('npm')}
                            className={cn(inputCls, errors.npm && errCls)}
                          />
                        </Field>

                        <Field id="angkatan" label="Angkatan" error={errors.angkatan?.message}>
                          {(a11y) => (
                            <Select
                              value={formData.angkatan}
                              onValueChange={(value) =>
                                setValue('angkatan', value, { shouldDirty: true, shouldValidate: true })
                              }
                            >
                              <SelectTrigger
                                id={a11y.id}
                                aria-describedby={a11y['aria-describedby']}
                                aria-invalid={a11y['aria-invalid']}
                                className={cn(
                                  'h-11 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 text-sm text-[var(--text-strong)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
                                  errors.angkatan && errCls
                                )}
                              >
                                <SelectValue placeholder="Pilih angkatan" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-strong)]">
                                {angkatanOptions.map((year) => (
                                  <SelectItem key={year} value={year}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </Field>
                      </div>

                      <Field
                        id="jalur"
                        label="Jalur Mahasiswa"
                        hint="Mahasiswa reguler mengikuti semester akademik. Mahasiswa RPL dapat memilih track sesuai ketentuan program studi."
                      >
                        {(a11y) => (
                          <Select
                            value={formData.jalur}
                            onValueChange={(value) =>
                              setValue('jalur', value, { shouldDirty: true, shouldValidate: true })
                            }
                          >
                            <SelectTrigger
                              id={a11y.id}
                              aria-describedby={a11y['aria-describedby']}
                              aria-invalid={a11y['aria-invalid']}
                              className="h-11 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 text-sm text-[var(--text-strong)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                            >
                              <SelectValue placeholder="Pilih jalur" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-strong)]">
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="rpl">RPL</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="email" label="Email" error={errors.email?.message}>
                          <Input
                            id="email"
                            type="email"
                            placeholder="contoh@email.com"
                            {...register('email')}
                            className={cn(inputCls, errors.email && errCls)}
                            autoComplete="email"
                          />
                        </Field>

                        <Field id="whatsapp" label="Nomor WhatsApp" error={errors.whatsapp?.message}>
                          <Input
                            id="whatsapp"
                            placeholder="08123456789"
                            inputMode="tel"
                            {...register('whatsapp')}
                            className={cn(inputCls, errors.whatsapp && errCls)}
                            autoComplete="tel"
                          />
                        </Field>
                      </div>

                      <Field id="password" label="Password" error={errors.password?.message}>
                        {(a11y) => (
                          <div>
                            <div className="relative">
                              <Input
                                {...a11y}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Minimal 8 karakter"
                                {...register('password')}
                                className={cn(inputCls, 'pr-10', errors.password && errCls)}
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                onClick={() => setShowPassword((prev) => !prev)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {formData.password && (
                              <div className="mt-2 flex flex-wrap gap-3">
                                <PasswordReq met={passwordCheck.length} text="8+ karakter" />
                                <PasswordReq met={passwordCheck.uppercase} text="Huruf besar" />
                                <PasswordReq met={passwordCheck.number} text="Angka" />
                              </div>
                            )}
                          </div>
                        )}
                      </Field>

                      <Field id="confirmPassword" label="Konfirmasi Password" error={errors.confirmPassword?.message}>
                        {(a11y) => (
                          <div className="relative">
                            <Input
                              {...a11y}
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Ulangi password"
                              {...register('confirmPassword')}
                              className={cn(inputCls, 'pr-10', errors.confirmPassword && errCls)}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
                              aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'}
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </Field>

                      <div className="space-y-1">
                        <div
                          className={cn(
                            'flex items-start gap-3 rounded-lg border bg-[var(--surface-sunken)] p-3.5',
                            errors.terms ? 'border-[hsl(var(--ctp-red))]' : 'border-[var(--line)]'
                          )}
                        >
                          <Checkbox
                            id="terms"
                            checked={formData.terms}
                            onCheckedChange={(checked) =>
                              setValue('terms', checked === true, { shouldDirty: true, shouldValidate: true })
                            }
                            className="mt-0.5 border-[var(--line)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
                          />
                          <label htmlFor="terms" className="text-xs leading-relaxed text-[var(--text-body)]">
                            Saya menyetujui{' '}
                            <Link
                              href="/syarat-layanan"
                              className="font-medium text-[var(--accent)] hover:underline"
                            >
                              syarat dan ketentuan
                            </Link>{' '}
                            serta{' '}
                            <Link
                              href="/kebijakan-privasi"
                              className="font-medium text-[var(--accent)] hover:underline"
                            >
                              kebijakan privasi
                            </Link>{' '}
                            platform.
                          </label>
                        </div>
                        {errors.terms?.message && (
                          <p role="alert" className="text-xs font-medium text-[hsl(var(--ctp-red))]">
                            {errors.terms?.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="h-11 w-full text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[hsl(var(--ctp-blue)/0.9)] transition-colors"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Mengirim OTP...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Daftar Akun
                          </span>
                        )}
                      </Button>
                    </motion.form>
                  )}

                  {step === 'otp' && (
                    <motion.form key="otp" {...stepVariants} transition={{ duration: 0.2 }} onSubmit={handleVerifyOTP}>
                      <div className="space-y-5">
                        {countdown > 0 && (
                          <p className="text-center text-xs font-medium text-[hsl(var(--ctp-peach))]">
                            Berlaku: {formatTime(countdown)}
                          </p>
                        )}

                        <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading || countdown > 240}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Kirim ulang kode
                          </button>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading || otp.length < 6}
                          className="h-11 w-full text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[hsl(var(--ctp-blue)/0.9)] transition-colors"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Memverifikasi...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Verifikasi dan Daftar
                            </span>
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setStep('form');
                            setOtp('');
                          }}
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Kembali ke form
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {step === 'success' && (
                    <motion.div key="success" {...stepVariants} transition={{ duration: 0.2 }}>
                      <div className="space-y-5 text-center">
                        <div className="flex justify-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--ctp-green)/0.12)] border border-[hsl(var(--ctp-green)/0.25)]">
                            <CheckCircle2 className="h-8 w-8 text-[hsl(var(--ctp-green))]" />
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--text-body)]">
                          Akun mahasiswa berhasil dibuat. Silakan login untuk mulai mengelola bimbingan.
                        </p>
                        <Button
                          onClick={() => router.push('/login')}
                          className="h-11 w-full text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[hsl(var(--ctp-blue)/0.9)] transition-colors"
                        >
                          Lanjut ke Login
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step === 'form' && (
                  <>
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-[var(--line)]" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        sudah punya akun
                      </span>
                      <div className="h-px flex-1 bg-[var(--line)]" />
                    </div>

                    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-3 text-center text-xs leading-relaxed text-[var(--text-body)]">
                      Sudah pernah membuat akun?{' '}
                      <Link
                        href="/login"
                        className="font-medium text-[var(--accent)] hover:underline transition-colors"
                      >
                        Masuk ke akun Anda
                      </Link>
                      .
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
