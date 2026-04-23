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
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authAPI } from '@/lib/api';
import { validateEmail, validateNPM, validateWhatsApp, validatePassword } from '@/lib/validators';

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
          className="h-14 w-11 rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.88)] text-center text-xl font-bold text-[hsl(var(--ctp-text))] transition-all focus:border-[hsl(var(--ctp-blue)/0.35)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ctp-blue)/0.18)] disabled:opacity-50"
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

const onboardingNotes = [
  'Data identitas mahasiswa divalidasi sebelum akun aktif.',
  'OTP email memastikan akun dibuat oleh pemilik alamat yang benar.',
  'Setelah login, seluruh proses proposal dan bimbingan ada di satu tempat.',
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    nama: '',
    npm: '',
    angkatan: '',
    jalur: 'regular',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const angkatanOptions = useMemo(() => getAngkatanOptions(), []);
  const passwordCheck = useMemo(() => validatePassword(formData.password), [formData.password]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleTermsChange = (checked) => {
    setFormData((prev) => ({ ...prev, terms: checked === true }));
    setErrors((prev) => ({ ...prev, terms: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.nama.trim()) errs.nama = 'Nama lengkap wajib diisi';
    else if (formData.nama.trim().length < 3) errs.nama = 'Nama minimal 3 karakter';
    if (!formData.npm.trim()) errs.npm = 'NPM wajib diisi';
    else if (!validateNPM(formData.npm.trim())) errs.npm = 'NPM harus berupa angka';
    if (!formData.angkatan) errs.angkatan = 'Pilih angkatan';
    if (!formData.email.trim()) errs.email = 'Email wajib diisi';
    else if (!validateEmail(formData.email.trim())) errs.email = 'Format email tidak valid';
    if (!formData.whatsapp.trim()) errs.whatsapp = 'Nomor WhatsApp wajib diisi';
    else if (!validateWhatsApp(formData.whatsapp.trim())) errs.whatsapp = 'Format nomor tidak valid (contoh: 08123456789)';
    if (!formData.password) errs.password = 'Password wajib diisi';
    else if (!passwordCheck.isValid) errs.password = 'Password belum memenuhi persyaratan';
    if (!formData.confirmPassword) errs.confirmPassword = 'Konfirmasi password wajib diisi';
    else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Password tidak cocok';
    if (!formData.terms) errs.terms = 'Anda harus menyetujui syarat dan ketentuan';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
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
        toast.success('Kode OTP telah dikirim ke email Anda!');
        setCountdown(result.data.expires_in || 300);
        setStep('otp');
      } else {
        const errorLower = (result.error || '').toLowerCase();
        if (errorLower.includes('email') && (errorLower.includes('sudah') || errorLower.includes('already'))) {
          setErrors((prev) => ({ ...prev, email: 'Email sudah terdaftar' }));
          toast.error('Email sudah terdaftar');
        } else if (errorLower.includes('npm') && (errorLower.includes('sudah') || errorLower.includes('already'))) {
          setErrors((prev) => ({ ...prev, npm: 'NPM sudah terdaftar' }));
          toast.error('NPM sudah terdaftar');
        } else {
          toast.error(result.error || 'Gagal mengirim OTP. Silakan coba lagi.');
        }
      }
    } catch (err) {
      console.error('Registration OTP error:', err);
      toast.error('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.verifyRegisterOTP(formData.email.trim(), otp);
      if (result.ok) {
        toast.success('Registrasi berhasil!');
        setStep('success');
      } else {
        toast.error(result.error || result.data?.message || 'Kode OTP tidak valid');
      }
    } catch {
      toast.error('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp('');
    setLoading(true);
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
        toast.success('Kode OTP baru telah dikirim!');
        setCountdown(result.data.expires_in || 300);
      } else {
        toast.error(result.error || 'Gagal mengirim ulang OTP');
      }
    } catch {
      toast.error('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const inputCls =
    'h-12 rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.84)] text-[hsl(var(--ctp-text))] placeholder:text-[hsl(var(--ctp-overlay1))] focus-visible:ring-[hsl(var(--ctp-blue)/0.2)] focus-visible:border-[hsl(var(--ctp-blue)/0.35)]';
  const errCls = 'border-[hsl(var(--ctp-red)/0.55)] focus-visible:ring-[hsl(var(--ctp-red)/0.2)]';

  const PasswordReq = ({ met, text }) => (
    <span className={`flex items-center gap-1 text-xs ${met ? 'text-[hsl(var(--ctp-green))]' : 'text-[hsl(var(--ctp-overlay1))]'}`}>
      {met ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
      {text}
    </span>
  );

  const FieldError = ({ msg }) => (msg ? <p className="text-xs text-[hsl(var(--ctp-red))]">{msg}</p> : null);

  const stepVariants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--ctp-lavender)/0.18),transparent_28%),radial-gradient(circle_at_bottom_right,hsl(var(--ctp-teal)/0.14),transparent_26%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
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
              Registrasi Mahasiswa
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-[hsl(var(--ctp-text))]">
              Buat akun dengan alur yang singkat dan mudah dipahami.
            </h1>
            <p className="mt-5 text-base leading-8 text-[hsl(var(--ctp-subtext1))]">
              Informasi yang dibutuhkan hanya yang relevan untuk proses akademik. Setelah itu,
              verifikasi email menyelesaikan pembuatan akun dengan aman.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {onboardingNotes.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[24px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.72)] p-4">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[hsl(var(--ctp-teal)/0.12)] text-[hsl(var(--ctp-teal))]">
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
          className="relative w-full max-w-2xl justify-self-center"
        >
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--ctp-subtext1))] transition-colors hover:text-[hsl(var(--ctp-blue))] lg:hidden">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <Card className="rounded-[32px] border-[hsl(var(--ctp-surface1)/0.9)] bg-[hsl(var(--ctp-base)/0.84)]">
            <CardHeader className="pb-1 pt-8 text-center">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,hsl(var(--ctp-teal)/0.18),hsl(var(--ctp-lavender)/0.18))]">
                {step === 'success' ? (
                  <CheckCircle2 className="h-8 w-8 text-[hsl(var(--ctp-green))]" />
                ) : step === 'otp' ? (
                  <ShieldCheck className="h-8 w-8 text-[hsl(var(--ctp-blue))]" />
                ) : (
                  <GraduationCap className="h-8 w-8 text-[hsl(var(--ctp-teal))]" />
                )}
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-[hsl(var(--ctp-text))]">
                {step === 'success' ? 'Registrasi Berhasil' : step === 'otp' ? 'Verifikasi Email' : 'Daftar Akun Baru'}
              </CardTitle>
              <CardDescription className="mt-2 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">
                {step === 'success'
                  ? 'Akun Anda sudah siap digunakan.'
                  : step === 'otp'
                    ? `Masukkan kode 6 digit yang dikirim ke ${formData.email}`
                    : 'Lengkapi data mahasiswa untuk mulai menggunakan sistem bimbingan.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8 sm:px-8">
              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.form
                    key="form"
                    {...stepVariants}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="nama" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Nama Lengkap</Label>
                      <Input id="nama" placeholder="Masukkan nama lengkap" value={formData.nama} onChange={handleChange('nama')} className={`${inputCls} ${errors.nama ? errCls : ''}`} />
                      <FieldError msg={errors.nama} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="npm" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">NPM</Label>
                        <Input id="npm" placeholder="1234567890" value={formData.npm} onChange={handleChange('npm')} className={`${inputCls} ${errors.npm ? errCls : ''}`} />
                        <FieldError msg={errors.npm} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="angkatan" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Angkatan</Label>
                        <Select value={formData.angkatan} onValueChange={handleChange('angkatan')}>
                          <SelectTrigger id="angkatan" className={`h-12 rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.84)] text-[hsl(var(--ctp-text))] ${errors.angkatan ? errCls : ''}`}>
                            <SelectValue placeholder="Pilih angkatan" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.96)]">
                            {angkatanOptions.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError msg={errors.angkatan} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jalur" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Jalur Mahasiswa</Label>
                      <Select value={formData.jalur} onValueChange={handleChange('jalur')}>
                        <SelectTrigger id="jalur" className="h-12 rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.84)] text-[hsl(var(--ctp-text))]">
                          <SelectValue placeholder="Pilih jalur" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.96)]">
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="rpl">RPL</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs leading-6 text-[hsl(var(--ctp-subtext0))]">
                        Regular mengikuti semester akademik. RPL dapat memilih track yang sedang dibuka koordinator.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Email</Label>
                        <Input id="email" type="email" placeholder="contoh@email.com" value={formData.email} onChange={handleChange('email')} className={`${inputCls} ${errors.email ? errCls : ''}`} />
                        <FieldError msg={errors.email} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Nomor WhatsApp</Label>
                        <Input id="whatsapp" placeholder="08123456789" value={formData.whatsapp} onChange={handleChange('whatsapp')} className={`${inputCls} ${errors.whatsapp ? errCls : ''}`} />
                        <FieldError msg={errors.whatsapp} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimal 8 karakter"
                          value={formData.password}
                          onChange={handleChange('password')}
                          className={`${inputCls} pr-11 ${errors.password ? errCls : ''}`}
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
                      {formData.password ? (
                        <div className="flex flex-wrap gap-3">
                          <PasswordReq met={passwordCheck.length} text="8+ karakter" />
                          <PasswordReq met={passwordCheck.uppercase} text="Huruf besar" />
                          <PasswordReq met={passwordCheck.number} text="Angka" />
                        </div>
                      ) : null}
                      <FieldError msg={errors.password} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-[hsl(var(--ctp-subtext1))]">Konfirmasi Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Ulangi password"
                        value={formData.confirmPassword}
                        onChange={handleChange('confirmPassword')}
                        className={`${inputCls} ${errors.confirmPassword ? errCls : ''}`}
                      />
                      <FieldError msg={errors.confirmPassword} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start gap-3 rounded-[22px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-crust)/0.62)] p-4">
                        <Checkbox
                          id="terms"
                          checked={formData.terms}
                          onCheckedChange={handleTermsChange}
                          className="mt-1 border-[hsl(var(--ctp-overlay0)/0.7)] data-[state=checked]:border-[hsl(var(--ctp-blue))] data-[state=checked]:bg-[hsl(var(--ctp-blue))]"
                        />
                        <label htmlFor="terms" className="text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">
                          Saya menyetujui syarat dan ketentuan serta kebijakan privasi platform.
                        </label>
                      </div>
                      <FieldError msg={errors.terms} />
                    </div>

                    <Button type="submit" className="h-12 w-full text-base" size="lg" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Mengirim OTP...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Daftar
                        </span>
                      )}
                    </Button>
                  </motion.form>
                )}

                {step === 'otp' && (
                  <motion.form key="otp" {...stepVariants} transition={{ duration: 0.25 }} onSubmit={handleVerifyOTP}>
                    <div className="space-y-6">
                      {countdown > 0 ? (
                        <p className="text-center text-sm font-medium text-[hsl(var(--ctp-peach))]">
                          Berlaku: {formatTime(countdown)}
                        </p>
                      ) : null}

                      <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={loading || countdown > 240}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--ctp-subtext0))] transition-colors hover:text-[hsl(var(--ctp-blue))] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Kirim ulang kode
                        </button>
                      </div>

                      <Button type="submit" disabled={loading || otp.length < 6} className="h-12 w-full text-base">
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 animate-spin" />
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
                        className="flex w-full items-center justify-center gap-2 text-sm font-medium text-[hsl(var(--ctp-subtext0))] transition-colors hover:text-[hsl(var(--ctp-text))]"
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
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[hsl(var(--ctp-green)/0.3)] bg-[hsl(var(--ctp-green)/0.12)]">
                          <CheckCircle2 className="h-10 w-10 text-[hsl(var(--ctp-green))]" />
                        </div>
                      </div>
                      <p className="text-base leading-8 text-[hsl(var(--ctp-subtext1))]">
                        Akun mahasiswa berhasil dibuat. Silakan login untuk mulai mengelola bimbingan.
                      </p>
                      <Button onClick={() => router.push('/login')} className="h-12 w-full text-base">
                        Lanjut ke Login
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step === 'form' ? (
                <>
                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[hsl(var(--ctp-surface1))]" />
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-[hsl(var(--ctp-overlay1))]">sudah punya akun</span>
                    <div className="h-px flex-1 bg-[hsl(var(--ctp-surface1))]" />
                  </div>

                  <div className="rounded-[24px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-crust)/0.68)] p-4 text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">
                    Sudah pernah membuat akun?{' '}
                    <Link href="/login" className="font-semibold text-[hsl(var(--ctp-blue))] transition-colors hover:text-[hsl(var(--ctp-teal))]">
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
  );
}
