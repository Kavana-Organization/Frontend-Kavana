'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CAMPUS_CONTACT, LANDING_CONTENT, PROJECT_OUTPUTS, SOCIAL_PROOF_CONFIG } from '@/lib/constants';

const ROLE_ICONS = [GraduationCap, Users, ShieldCheck, ClipboardList];
const FEATURE_ICONS = [BookOpenText, MessageSquareText, ShieldCheck, CalendarClock];
const STEP_ICONS = [Sparkles, BookOpenText, ClipboardList, MessageSquareText, CheckCircle2];
const projectOne = PROJECT_OUTPUTS.project1;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div id="top" className="relative min-h-screen overflow-x-clip text-[hsl(var(--ctp-text))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(circle_at_top_left,hsl(var(--ctp-sky)/0.18),transparent_35%),radial-gradient(circle_at_top_right,hsl(var(--ctp-lavender)/0.2),transparent_30%)]" />

      <header className="sticky top-0 z-50 border-b border-[hsl(var(--ctp-surface1)/0.75)] bg-[hsl(var(--ctp-base)/0.8)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Kavana Home">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--ctp-blue)),hsl(var(--ctp-teal)))] text-white shadow-[0_18px_38px_-24px_hsl(var(--ctp-blue)/0.75)]">
              <Image src="/D4TI.png" alt="D4TI" width={20} height={20} className="h-5 w-5 object-contain" />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight">{LANDING_CONTENT.brand.name}</span>
              <span className="block text-xs text-[hsl(var(--ctp-subtext0))]">{LANDING_CONTENT.brand.subtitle}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
            {LANDING_CONTENT.nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-[hsl(var(--ctp-subtext1))] transition-colors hover:text-[hsl(var(--ctp-blue))]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-[hsl(var(--ctp-subtext1))] transition-colors hover:text-[hsl(var(--ctp-blue))] md:inline-flex"
            >
              Masuk
            </Link>
            <Link href="/register">
              <Button className="px-5">Daftar</Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[hsl(var(--ctp-surface1)/0.75)] bg-[hsl(var(--ctp-base)/0.95)] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {LANDING_CONTENT.nav.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-[hsl(var(--ctp-subtext1))] transition-colors hover:bg-[hsl(var(--ctp-crust))] hover:text-[hsl(var(--ctp-blue))]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
          <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <motion.div variants={stagger} className="space-y-7">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ctp-blue)/0.2)] bg-[hsl(var(--ctp-blue)/0.08)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--ctp-blue))]">
                <Sparkles className="h-3.5 w-3.5" />
                {LANDING_CONTENT.hero.badge}
              </motion.div>

              <motion.div variants={fadeUp} className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                  {LANDING_CONTENT.hero.title}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[hsl(var(--ctp-subtext1))] sm:text-lg">
                  {LANDING_CONTENT.hero.description}
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
                <Link href={LANDING_CONTENT.hero.primaryCta.href}>
                  <Button size="lg" className="w-full px-7 sm:w-auto">
                    {LANDING_CONTENT.hero.primaryCta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={LANDING_CONTENT.hero.secondaryCta.href}>
                  <Button variant="outline" size="lg" className="w-full px-7 sm:w-auto">
                    {LANDING_CONTENT.hero.secondaryCta.label}
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={stagger} className="grid gap-3 sm:grid-cols-3">
                {LANDING_CONTENT.stats.map((stat) => (
                  <motion.article key={stat.label} variants={fadeUp} className="soft-card rounded-[28px] p-5">
                    <p className="text-lg font-black text-[hsl(var(--ctp-text))]">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[hsl(var(--ctp-subtext0))]">{stat.label}</p>
                  </motion.article>
                ))}
              </motion.div>
            </motion.div>

            <motion.aside variants={fadeUp} className="soft-panel rounded-[32px] p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ctp-subtext0))]">
                    Alur yang Jelas
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Satu portal untuk seluruh proses bimbingan.</h2>
                </div>
                <span className="rounded-full border border-[hsl(var(--ctp-green)/0.25)] bg-[hsl(var(--ctp-green)/0.12)] px-3 py-1 text-xs font-semibold text-[hsl(var(--ctp-green))]">
                  Terstruktur
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {LANDING_CONTENT.steps.slice(0, 4).map((step) => {
                  const Icon = STEP_ICONS[step.num - 1] || CheckCircle2;
                  return (
                    <div key={step.num} className="flex items-start gap-4 rounded-[24px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.7)] p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[hsl(var(--ctp-blue)/0.1)] text-[hsl(var(--ctp-blue))]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">
                          Tahap {step.num}: {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[hsl(var(--ctp-subtext0))]">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.aside>
          </motion.div>
        </section>

        <section id="features" className="border-y border-[hsl(var(--ctp-surface1)/0.85)] bg-[hsl(var(--ctp-mantle)/0.45)] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-blue))]">Fitur Utama</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{LANDING_CONTENT.about.title}</h2>
              <p className="mt-4 text-base leading-8 text-[hsl(var(--ctp-subtext1))]">{LANDING_CONTENT.about.description}</p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {LANDING_CONTENT.features.map((feature, index) => {
                const Icon = FEATURE_ICONS[index] || BookOpenText;
                return (
                  <article key={feature.num} className="soft-card rounded-[28px] p-6">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--ctp-blue)/0.1)] text-[hsl(var(--ctp-blue))]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-5 text-sm font-semibold text-[hsl(var(--ctp-subtext0))]">{feature.num}</p>
                    <h3 className="mt-2 text-xl font-bold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">{feature.desc}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="soft-card rounded-[30px] p-6">
                <h3 className="text-xl font-bold">Apa yang pengguna dapatkan?</h3>
                <ul className="mt-5 space-y-4">
                  {LANDING_CONTENT.about.bullets.map((text) => (
                    <li key={text} className="flex items-start gap-3 text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-[hsl(var(--ctp-green))]" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div id="roles" className="grid gap-4 sm:grid-cols-2">
                {LANDING_CONTENT.roles.map((role, index) => {
                  const Icon = ROLE_ICONS[index] || Users;
                  return (
                    <article key={role.title} className="soft-card rounded-[28px] p-6">
                      <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--ctp-blue)/0.2),hsl(var(--ctp-teal)/0.16))] text-[hsl(var(--ctp-blue))]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ctp-subtext0))]">Peran {role.letter}</p>
                          <h3 className="text-lg font-bold">{role.title}</h3>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">{role.desc}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-5 lg:grid-cols-5">
            {LANDING_CONTENT.steps.map((step) => (
              <article key={step.num} className="soft-card rounded-[28px] p-5">
                <span className="inline-flex rounded-full border border-[hsl(var(--ctp-blue)/0.18)] bg-[hsl(var(--ctp-blue)/0.08)] px-3 py-1 text-xs font-semibold text-[hsl(var(--ctp-blue))]">
                  Tahap {step.num}
                </span>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="soft-panel rounded-[34px] px-6 py-7 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-blue))]">
                {projectOne.label}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Luaran tahap pertama sudah bisa ditampilkan sebagai demo aplikasi yang utuh.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[hsl(var(--ctp-subtext1))]">
                Fokus awal proyek adalah memperlihatkan bentuk aplikasi implementor secara jelas:
                halaman publik, autentikasi, dashboard, dan alur inti yang cukup untuk presentasi proyek 1.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/luaran-proyek-1">
                  <Button size="lg" className="w-full px-7 sm:w-auto">
                    Lihat Luaran Proyek 1
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/panduan-pengguna">
                  <Button variant="outline" size="lg" className="w-full px-7 sm:w-auto">
                    Buka Panduan
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {projectOne.deliverables.map((item) => (
                <article key={item.title} className="soft-card rounded-[28px] p-5">
                  <span className="inline-flex rounded-full border border-[hsl(var(--ctp-green)/0.22)] bg-[hsl(var(--ctp-green)/0.12)] px-3 py-1 text-xs font-semibold text-[hsl(var(--ctp-green))]">
                    {item.status}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="soft-panel rounded-[34px] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-blue))]">Siap Dipakai</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{LANDING_CONTENT.cta.title}</h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-[hsl(var(--ctp-subtext1))]">{LANDING_CONTENT.cta.description}</p>
                <div className="mt-6">
                  <Link href={LANDING_CONTENT.cta.button.href}>
                    <Button size="lg" className="px-7">
                      {LANDING_CONTENT.cta.button.label}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div id="contact" className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.72)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ctp-subtext0))]">Kontak</p>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">{CAMPUS_CONTACT.address}</p>
                  <p className="mt-3 text-sm text-[hsl(var(--ctp-text))]">{CAMPUS_CONTACT.phone}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--ctp-text))]">{CAMPUS_CONTACT.email}</p>
                </div>
                <div className="rounded-[24px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.72)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ctp-subtext0))]">Jam Layanan</p>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">{CAMPUS_CONTACT.officeHours}</p>
                  {SOCIAL_PROOF_CONFIG.notice ? (
                    <p className="mt-5 rounded-2xl bg-[hsl(var(--ctp-yellow)/0.15)] px-4 py-3 text-sm leading-6 text-[hsl(var(--ctp-subtext1))]">
                      {SOCIAL_PROOF_CONFIG.notice}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-[hsl(var(--ctp-surface1)/0.85)] bg-[hsl(var(--ctp-mantle)/0.42)]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-blue))]">
                Kavana
              </p>
              <p className="mt-4 max-w-md text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">
                Platform bimbingan online untuk membantu mahasiswa, dosen, dan pengelola prodi
                bekerja dalam alur akademik yang lebih rapi dan terdokumentasi.
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-[hsl(var(--ctp-text))]">Akses Platform</p>
              <div className="mt-4 flex flex-col gap-3">
                {LANDING_CONTENT.footer.platformLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-[hsl(var(--ctp-subtext1))] transition-colors hover:text-[hsl(var(--ctp-blue))]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-[hsl(var(--ctp-text))]">Sumber Daya</p>
              <div className="mt-4 flex flex-col gap-3">
                {LANDING_CONTENT.footer.resourceLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-[hsl(var(--ctp-subtext1))] transition-colors hover:text-[hsl(var(--ctp-blue))]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--ctp-surface1)/0.85)] px-4 py-5 text-center text-sm text-[hsl(var(--ctp-subtext0))] sm:px-6 lg:px-8">
            {LANDING_CONTENT.footer.copyright}
          </div>
        </footer>
      </main>
    </div>
  );
}
