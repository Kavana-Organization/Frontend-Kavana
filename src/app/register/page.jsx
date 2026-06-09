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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authAPI } from '@/lib/api';
import { trackAuthEvent, trackAuthPageView } from '@/lib/auth-tracker';
import { validateRegisterEmail, validateNPM, validateWhatsApp, validatePassword } from '@/lib/validators';

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
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          aria-label={`Digit OTP ${i + 1}`}
          className="h-14 w-11 rounded-xl border border-slate-300 bg-white text-center text-xl font-bold text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
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
    'h-12 rounded-xl border-slate-300 bg-white px-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-300 dark:bg-white dark:text-slate-900 dark:placeholder:text-slate-400';
  const errCls = 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20';

  const PasswordReq = ({ met, text }) => (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${met ? 'text-emerald-600' : 'text-slate-500'}`}>
      {met ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
      {text}
    </span>
  );

  const FieldError = ({ msg }) => (msg ? <p className="text-xs font-medium text-red-600">{msg}</p> : null);

  const stepVariants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-6 text-slate-900 selection:bg-blue-200 selection:text-slate-950 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="relative mx-auto grid w-full max-w-7xl items-start gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:sticky lg:top-10 lg:pt-2"
        >
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <div className="mt-6 max-w-xl lg:mt-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-normal text-blue-700">
              <GraduationCap className="h-4 w-4" />
              Portal Akademik D4TI ULBI
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
              Buat akun untuk mulai mengelola proses bimbingan akademik.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Melalui akun Kavana, mahasiswa dapat mengajukan proposal, mengikuti proses validasi,
              mencatat bimbingan, dan memantau progress akademik dalam satu sistem.
            </p>
          </div>

          <div className="mt-8 hidden gap-4 sm:grid lg:mt-10">
            {registerBenefits.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full max-w-2xl justify-self-center"
        >
          <Card className="gap-0 rounded-3xl border-slate-200 bg-white py-0 text-slate-900 shadow-xl shadow-blue-950/10 backdrop-blur-none dark:border-slate-200 dark:bg-white dark:text-slate-900">
            <CardHeader className="pb-1 pt-8 text-center">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
                {step === 'success' ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                ) : step === 'otp' ? (
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                ) : (
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <CardTitle className="text-3xl font-bold tracking-normal text-slate-950">
                {step === 'success' ? 'Registrasi Berhasil' : step === 'otp' ? 'Verifikasi Email' : 'Daftar Akun Baru'}
              </CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-600">
                {step === 'success'
                  ? 'Akun Anda sudah siap digunakan.'
                  : step === 'otp'
                    ? `Masukkan kode 6 digit yang dikirim ke ${formData.email}`
                    : 'Lengkapi data berikut untuk mulai menggunakan Kavana sebagai sistem bimbingan akademik.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 pb-7 sm:px-8 sm:pb-8">
              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.form
                    key="form"
                    {...stepVariants}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleFormSubmit(handleSubmit, handleInvalidSubmit)}
                    noValidate
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="nama" className="text-sm font-semibold text-slate-700">Nama Lengkap</Label>
                      <Input id="nama" placeholder="Masukkan nama lengkap" aria-invalid={Boolean(errors.nama)} {...register('nama')} className={`${inputCls} ${errors.nama ? errCls : ''}`} />
                      <FieldError msg={errors.nama?.message} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="npm" className="text-sm font-semibold text-slate-700">NPM</Label>
                        <Input id="npm" placeholder="1234567890" inputMode="numeric" aria-invalid={Boolean(errors.npm)} {...register('npm')} className={`${inputCls} ${errors.npm ? errCls : ''}`} />
                        <FieldError msg={errors.npm?.message} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="angkatan" className="text-sm font-semibold text-slate-700">Angkatan</Label>
                        <Select
                          value={formData.angkatan}
                          onValueChange={(value) => setValue('angkatan', value, { shouldDirty: true, shouldValidate: true })}
                        >
                          <SelectTrigger id="angkatan" aria-invalid={Boolean(errors.angkatan)} className={`h-12 rounded-xl border-slate-300 bg-white text-slate-900 shadow-sm focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-300 dark:bg-white dark:text-slate-900 ${errors.angkatan ? errCls : ''}`}>
                            <SelectValue placeholder="Pilih angkatan" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-900 dark:border-slate-200 dark:bg-white dark:text-slate-900">
                            {angkatanOptions.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError msg={errors.angkatan?.message} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jalur" className="text-sm font-semibold text-slate-700">Jalur Mahasiswa</Label>
                      <Select
                        value={formData.jalur}
                        onValueChange={(value) => setValue('jalur', value, { shouldDirty: true, shouldValidate: true })}
                      >
                        <SelectTrigger id="jalur" className="h-12 rounded-xl border-slate-300 bg-white text-slate-900 shadow-sm focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-300 dark:bg-white dark:text-slate-900">
                          <SelectValue placeholder="Pilih jalur" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-900 dark:border-slate-200 dark:bg-white dark:text-slate-900">
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="rpl">RPL</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs leading-6 text-slate-500">
                        Mahasiswa reguler mengikuti semester akademik. Mahasiswa RPL dapat memilih track sesuai ketentuan program studi.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
                        <Input id="email" type="email" placeholder="contoh@email.com" aria-invalid={Boolean(errors.email)} {...register('email')} className={`${inputCls} ${errors.email ? errCls : ''}`} />
                        <FieldError msg={errors.email?.message} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-sm font-semibold text-slate-700">Nomor WhatsApp</Label>
                        <Input id="whatsapp" placeholder="08123456789" inputMode="tel" aria-invalid={Boolean(errors.whatsapp)} {...register('whatsapp')} className={`${inputCls} ${errors.whatsapp ? errCls : ''}`} />
                        <FieldError msg={errors.whatsapp?.message} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimal 8 karakter"
                          aria-invalid={Boolean(errors.password)}
                          {...register('password')}
                          className={`${inputCls} pr-11 ${errors.password ? errCls : ''}`}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formData.password ? (
                        <div className="flex flex-wrap gap-3">
                          <PasswordReq met={passwordCheck.length} text="8+ karakter" />
                          <PasswordReq met={passwordCheck.uppercase} text="Huruf besar" />
                          <PasswordReq met={passwordCheck.number} text="Angka" />
                        </div>
                      ) : null}
                      <FieldError msg={errors.password?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Konfirmasi Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Ulangi password"
                          aria-invalid={Boolean(errors.confirmPassword)}
                          {...register('confirmPassword')}
                          className={`${inputCls} pr-11 ${errors.confirmPassword ? errCls : ''}`}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FieldError msg={errors.confirmPassword?.message} />
                    </div>

                    <div className="space-y-1">
                      <div className={`flex items-start gap-3 rounded-xl border bg-slate-50 p-4 ${errors.terms ? 'border-red-300' : 'border-slate-200'}`}>
                        <Checkbox
                          id="terms"
                          checked={formData.terms}
                          onCheckedChange={(checked) => setValue('terms', checked === true, { shouldDirty: true, shouldValidate: true })}
                          className="mt-1 border-slate-400 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                        />
                        <label htmlFor="terms" className="text-sm leading-7 text-slate-600">
                          Saya menyetujui{' '}
                          <Link href="/syarat-layanan" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                            syarat dan ketentuan
                          </Link>{' '}
                          serta{' '}
                          <Link href="/kebijakan-privasi" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                            kebijakan privasi
                          </Link>{' '}
                          platform.
                        </label>
                      </div>
                      <FieldError msg={errors.terms?.message} />
                    </div>

                    <Button type="submit" className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md" size="lg" disabled={loading}>
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
                  <motion.form key="otp" {...stepVariants} transition={{ duration: 0.25 }} onSubmit={handleVerifyOTP}>
                    <div className="space-y-6">
                      {countdown > 0 ? (
                        <p className="text-center text-sm font-semibold text-amber-700">
                          Berlaku: {formatTime(countdown)}
                        </p>
                      ) : null}

                      <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={loading || countdown > 240}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Kirim ulang kode
                        </button>
                      </div>

                      <Button type="submit" disabled={loading || otp.length < 6} className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white shadow-sm hover:bg-blue-700">
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
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke form
                      </button>
                    </div>
                  </motion.form>
                )}

                {step === 'success' && (
                  <motion.div key="success" {...stepVariants} transition={{ duration: 0.25 }}>
                    <div className="space-y-6 text-center">
                      <div className="flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-base leading-8 text-slate-600">
                        Akun mahasiswa berhasil dibuat. Silakan login untuk mulai mengelola bimbingan.
                      </p>
                      <Button onClick={() => router.push('/login')} className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-700">
                        Lanjut ke Login
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step === 'form' ? (
                <>
                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">sudah punya akun</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm leading-7 text-slate-600">
                    Sudah pernah membuat akun?{' '}
                    <Link href="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                      Masuk ke akun Anda
                    </Link>
                    .
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
    </MotionConfig>
  );
}
