'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { authAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

// ==============================
// STEP INDICATOR
// ==============================
function StepIndicator({ current, steps }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
              i < current
                ? 'border border-[hsl(var(--ctp-green)/0.4)] bg-[hsl(var(--ctp-green)/0.15)] text-[hsl(var(--ctp-green))]'
                : i === current
                  ? 'border border-[hsl(var(--ctp-blue)/0.4)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text-muted)]'
            )}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-8 rounded-full transition-colors',
                i < current ? 'bg-[hsl(var(--ctp-green)/0.4)]' : 'bg-[var(--line)]'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ==============================
// OTP INPUT (6 digits)
// ==============================
function OTPInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);

  const handleChange = (i, e) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newOtp = value.split('');
    newOtp[i] = val.slice(-1);
    const joined = newOtp.join('');
    onChange(joined);

    // Auto-focus next
    if (val && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, ''));
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
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

// ==============================
// MAIN PAGE
// ==============================
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0: email, 1: OTP, 2: new password, 3: success
  const [loading, setLoading] = useState(false);

  // Step 0: email
  const [email, setEmail] = useState('');

  // Step 1: OTP
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resetToken, setResetToken] = useState('');

  // Step 2: new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ======== STEP 0: Request OTP ========
  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error('Email wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.requestOTP(email.trim());
      if (res.ok) {
        toast.success('Kode OTP telah dikirim ke email Anda!');
        setCountdown(res.data.expires_in || 300);
        setStep(1);
      } else {
        toast.error(res.error || res.data?.message || 'Gagal mengirim OTP');
      }
    } catch {
      toast.error('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  // ======== STEP 1: Verify OTP ========
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(email.trim(), otp);
      if (res.ok) {
        toast.success('Kode OTP berhasil diverifikasi!');
        setResetToken(res.data.reset_token);
        setStep(2);
      } else {
        toast.error(res.error || res.data?.message || 'Kode OTP tidak valid');
      }
    } catch {
      toast.error('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  // ======== STEP 2: Reset Password ========
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!newPassword) {
      toast.error('Password baru wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(resetToken, newPassword);
      if (res.ok) {
        toast.success('Password berhasil direset!');
        setStep(3);
      } else {
        toast.error(res.error || res.data?.message || 'Gagal mereset password');
      }
    } catch {
      toast.error('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setOtp('');
    await handleRequestOTP();
  };

  // Format countdown
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const inputCls =
    'h-11 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] transition-colors';

  const stepVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[420px]"
      >
        {/* Back to login */}
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>

        <Card className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
          <CardContent className="px-6 pb-8 pt-6">
            {/* Header icon */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <KeyRound className="h-6 w-6" />
              </div>
            </div>

            <h1 className="mb-1 text-center text-xl font-semibold tracking-tight text-[var(--text-strong)]">
              {step === 3 ? 'Password Berhasil Direset!' : 'Lupa Password'}
            </h1>
            <p className="mb-5 text-center text-xs leading-relaxed text-[var(--text-muted)]">
              {step === 0 && 'Masukkan email untuk menerima kode verifikasi.'}
              {step === 1 && 'Masukkan kode 6 digit yang dikirim ke email Anda.'}
              {step === 2 && 'Buat password baru untuk akun Anda.'}
              {step === 3 && 'Silakan login dengan password baru Anda.'}
            </p>

            {step < 3 && <StepIndicator current={step} steps={['Email', 'OTP', 'Password']} />}

            <AnimatePresence mode="wait">
              {/* ======== STEP 0: Email ======== */}
              {step === 0 && (
                <motion.form key="step0" {...stepVariants} transition={{ duration: 0.2 }} onSubmit={handleRequestOTP}>
                  <div className="space-y-4">
                    <Field id="email" label="Email">
                      {(a11y) => (
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                          <Input
                            {...a11y}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            className={cn(inputCls, 'pl-10')}
                            autoFocus
                          />
                        </div>
                      )}
                    </Field>
                    <Button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="h-11 w-full text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[hsl(var(--ctp-blue)/0.9)] transition-colors"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Mengirim...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Kirim Kode OTP <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* ======== STEP 1: OTP ======== */}
              {step === 1 && (
                <motion.form key="step1" {...stepVariants} transition={{ duration: 0.2 }} onSubmit={handleVerifyOTP}>
                  <div className="space-y-5">
                    {/* OTP info */}
                    <div className="text-center">
                      <p className="text-xs text-[var(--text-muted)]">
                        Dikirim ke <span className="font-medium text-[var(--accent)]">{email}</span>
                      </p>
                      {countdown > 0 && (
                        <p className="mt-1 text-xs font-medium text-[hsl(var(--ctp-peach))]">
                          Berlaku: {formatTime(countdown)}
                        </p>
                      )}
                    </div>

                    {/* OTP Input */}
                    <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                    {/* Resend */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading || countdown > 240}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw className="h-3 w-3" /> Kirim ulang kode
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="h-11 w-full text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[hsl(var(--ctp-blue)/0.9)] transition-colors"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Memverifikasi...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" /> Verifikasi OTP
                        </span>
                      )}
                    </Button>

                    {/* Back button */}
                    <button
                      type="button"
                      onClick={() => {
                        setStep(0);
                        setOtp('');
                      }}
                      className="flex w-full items-center justify-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                    >
                      <ArrowLeft className="h-3 w-3" /> Ganti email
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ======== STEP 2: New Password ======== */}
              {step === 2 && (
                <motion.form key="step2" {...stepVariants} transition={{ duration: 0.2 }} onSubmit={handleResetPassword}>
                  <div className="space-y-4">
                    <Field id="newPassword" label="Password Baru">
                      {(a11y) => (
                        <div className="relative">
                          <Input
                            {...a11y}
                            type={showPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className={cn(inputCls, 'pr-10')}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
                            aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      )}
                    </Field>

                    <Field id="confirmPassword" label="Konfirmasi Password">
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputCls}
                      />
                    </Field>

                    {/* Password strength */}
                    {newPassword && (
                      <div className="text-xs">
                        {newPassword.length < 6 ? (
                          <span className="text-[hsl(var(--ctp-red))]">⚠ Minimal 6 karakter</span>
                        ) : newPassword.length < 10 ? (
                          <span className="text-[hsl(var(--ctp-peach))]">● Cukup kuat</span>
                        ) : (
                          <span className="text-[hsl(var(--ctp-green))]">● Password kuat</span>
                        )}
                        {confirmPassword && newPassword !== confirmPassword && (
                          <span className="ml-3 text-[hsl(var(--ctp-red))]">⚠ Tidak cocok</span>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !newPassword || newPassword !== confirmPassword}
                      className="h-11 w-full text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[hsl(var(--ctp-blue)/0.9)] transition-colors"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Menyimpan...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4" /> Reset Password
                        </span>
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* ======== STEP 3: Success ======== */}
              {step === 3 && (
                <motion.div key="step3" {...stepVariants} transition={{ duration: 0.2 }}>
                  <div className="space-y-5 text-center">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--ctp-green)/0.12)] border border-[hsl(var(--ctp-green)/0.25)]">
                        <CheckCircle2 className="h-8 w-8 text-[hsl(var(--ctp-green))]" />
                      </div>
                    </div>
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
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} KavanaHub — Sistem Bimbingan Online
        </p>
      </motion.div>
    </div>
  );
}
