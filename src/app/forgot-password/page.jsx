'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Mail, ArrowLeft, ArrowRight, KeyRound, ShieldCheck,
  Eye, EyeOff, RotateCcw, CheckCircle2, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/lib/api';

// ==============================
// STEP INDICATOR
// ==============================
function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
            i < current
              ? 'bg-[hsl(var(--ctp-green)/0.2)] text-[hsl(var(--ctp-green))] border border-[hsl(var(--ctp-green)/0.4)]'
              : i === current
                ? 'bg-[hsl(var(--ctp-lavender)/0.2)] text-[hsl(var(--ctp-lavender))] border border-[hsl(var(--ctp-lavender)/0.4)] shadow-sm shadow-[hsl(var(--ctp-lavender)/0.15)]'
                : 'bg-[hsl(var(--ctp-surface0)/0.4)] text-[hsl(var(--ctp-overlay0))] border border-[hsl(var(--ctp-overlay0)/0.2)]'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 rounded-full transition-all ${
              i < current ? 'bg-[hsl(var(--ctp-green)/0.4)]' : 'bg-[hsl(var(--ctp-overlay0)/0.2)]'
            }`} />
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
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border transition-all
            bg-[hsl(var(--ctp-surface0)/0.45)] border-[hsl(var(--ctp-overlay0)/0.35)] 
            text-[hsl(var(--ctp-text))] 
            focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ctp-lavender)/0.4)] focus:border-[hsl(var(--ctp-lavender)/0.5)]
            disabled:opacity-50`}
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
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ======== STEP 0: Request OTP ========
  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    if (!email.trim()) { toast.error('Email wajib diisi'); return; }

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
    if (otp.length < 6) { toast.error('Masukkan 6 digit kode OTP'); return; }

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
    if (!newPassword) { toast.error('Password baru wajib diisi'); return; }
    if (newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    if (newPassword !== confirmPassword) { toast.error('Konfirmasi password tidak cocok'); return; }

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

  const inputCls = "h-11 rounded-xl bg-[hsl(var(--ctp-surface0)/0.45)] border-[hsl(var(--ctp-overlay0)/0.35)] text-[hsl(var(--ctp-text))] placeholder:text-[hsl(var(--ctp-overlay1))] focus-visible:ring-[hsl(var(--ctp-lavender)/0.4)] focus-visible:border-[hsl(var(--ctp-lavender)/0.5)] transition-colors";

  const stepVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ctp-crust))] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[hsl(var(--ctp-lavender)/0.06)] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[hsl(var(--ctp-mauve)/0.05)] blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[hsl(var(--ctp-blue)/0.04)] blur-[100px]" />
      </div>

      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--ctp-text)) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to login */}
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--ctp-subtext0))] hover:text-[hsl(var(--ctp-lavender))] transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Login
        </Link>

        <Card className="bg-[hsl(var(--ctp-base)/0.75)] border-[hsl(var(--ctp-overlay0)/0.2)] backdrop-blur-xl shadow-2xl shadow-black/20 rounded-2xl">
          <CardContent className="pt-6 pb-8 px-6">
            {/* Header icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--ctp-lavender)/0.12)] border border-[hsl(var(--ctp-lavender)/0.25)] flex items-center justify-center">
                <KeyRound className="w-7 h-7 text-[hsl(var(--ctp-lavender))]" />
              </div>
            </div>

            <h1 className="text-xl font-bold text-center text-[hsl(var(--ctp-text))] mb-1">
              {step === 3 ? 'Password Berhasil Direset!' : 'Lupa Password'}
            </h1>
            <p className="text-sm text-center text-[hsl(var(--ctp-subtext0))] mb-5">
              {step === 0 && 'Masukkan email untuk menerima kode verifikasi.'}
              {step === 1 && 'Masukkan kode 6 digit yang dikirim ke email Anda.'}
              {step === 2 && 'Buat password baru untuk akun Anda.'}
              {step === 3 && 'Silakan login dengan password baru Anda.'}
            </p>

            {step < 3 && <StepIndicator current={step} steps={['Email', 'OTP', 'Password']} />}

            <AnimatePresence mode="wait">
              {/* ======== STEP 0: Email ======== */}
              {step === 0 && (
                <motion.form key="step0" {...stepVariants} transition={{ duration: 0.25 }} onSubmit={handleRequestOTP}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-[hsl(var(--ctp-subtext1))]">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--ctp-overlay1))]" />
                        <Input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          className={`${inputCls} pl-10`}
                          autoFocus
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full h-11 rounded-xl bg-[hsl(var(--ctp-lavender))] text-[hsl(var(--ctp-crust))] hover:bg-[hsl(var(--ctp-lavender)/0.85)] font-semibold"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Mengirim...</span>
                      ) : (
                        <span className="flex items-center gap-2">Kirim Kode OTP <ArrowRight className="w-4 h-4" /></span>
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* ======== STEP 1: OTP ======== */}
              {step === 1 && (
                <motion.form key="step1" {...stepVariants} transition={{ duration: 0.25 }} onSubmit={handleVerifyOTP}>
                  <div className="space-y-5">
                    {/* OTP info */}
                    <div className="text-center">
                      <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                        Dikirim ke <span className="text-[hsl(var(--ctp-lavender))] font-medium">{email}</span>
                      </p>
                      {countdown > 0 && (
                        <p className="text-xs text-[hsl(var(--ctp-peach))] mt-1">
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
                        disabled={loading || countdown > 240} // allow resend after 1 minute
                        className="text-xs text-[hsl(var(--ctp-subtext0))] hover:text-[hsl(var(--ctp-lavender))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Kirim ulang kode
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="w-full h-11 rounded-xl bg-[hsl(var(--ctp-lavender))] text-[hsl(var(--ctp-crust))] hover:bg-[hsl(var(--ctp-lavender)/0.85)] font-semibold"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Memverifikasi...</span>
                      ) : (
                        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Verifikasi OTP</span>
                      )}
                    </Button>

                    {/* Back button */}
                    <button
                      type="button"
                      onClick={() => { setStep(0); setOtp(''); }}
                      className="w-full text-xs text-[hsl(var(--ctp-subtext0))] hover:text-[hsl(var(--ctp-text))] transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Ganti email
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ======== STEP 2: New Password ======== */}
              {step === 2 && (
                <motion.form key="step2" {...stepVariants} transition={{ duration: 0.25 }} onSubmit={handleResetPassword}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-[hsl(var(--ctp-subtext1))]">Password Baru</Label>
                      <div className="relative">
                        <Input
                          type={showPw ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`${inputCls} pr-10`}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ctp-overlay1))] hover:text-[hsl(var(--ctp-text))] transition-colors"
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-[hsl(var(--ctp-subtext1))]">Konfirmasi Password</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputCls}
                      />
                    </div>

                    {/* Password strength */}
                    {newPassword && (
                      <div className="text-xs">
                        {newPassword.length < 6
                          ? <span className="text-[hsl(var(--ctp-red))]">⚠ Minimal 6 karakter</span>
                          : newPassword.length < 10
                            ? <span className="text-[hsl(var(--ctp-peach))]">● Cukup kuat</span>
                            : <span className="text-[hsl(var(--ctp-green))]">● Password kuat</span>
                        }
                        {confirmPassword && newPassword !== confirmPassword && (
                          <span className="text-[hsl(var(--ctp-red))] ml-3">⚠ Tidak cocok</span>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !newPassword || newPassword !== confirmPassword}
                      className="w-full h-11 rounded-xl bg-[hsl(var(--ctp-lavender))] text-[hsl(var(--ctp-crust))] hover:bg-[hsl(var(--ctp-lavender)/0.85)] font-semibold"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Menyimpan...</span>
                      ) : (
                        <span className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Reset Password</span>
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* ======== STEP 3: Success ======== */}
              {step === 3 && (
                <motion.div key="step3" {...stepVariants} transition={{ duration: 0.25 }}>
                  <div className="text-center space-y-5">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-[hsl(var(--ctp-green)/0.15)] border border-[hsl(var(--ctp-green)/0.3)] flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-[hsl(var(--ctp-green))]" />
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/login')}
                      className="w-full h-11 rounded-xl bg-[hsl(var(--ctp-green)/0.2)] text-[hsl(var(--ctp-green))] hover:bg-[hsl(var(--ctp-green)/0.3)] border border-[hsl(var(--ctp-green)/0.35)] font-semibold"
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
        <p className="text-center text-xs text-[hsl(var(--ctp-overlay0))] mt-6">
          &copy; {new Date().getFullYear()} KavanaHub — Sistem Bimbingan Online
        </p>
      </motion.div>
    </div>
  );
}
