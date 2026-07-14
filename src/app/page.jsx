'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileText,
  GraduationCap,
  Landmark,
  Menu,
  MessagesSquare,
  Route,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { motion, MotionConfig } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CAMPUS_CONTACT } from '@/lib/constants';

const NAV_ITEMS = [
  { label: 'Beranda', href: '#top' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Peran', href: '#peran' },
  { label: 'Alur', href: '#alur' },
  { label: 'Kontak', href: '#kontak' },
];

const HIGHLIGHTS = [
  {
    title: 'Data Terpusat',
    description: 'Informasi bimbingan tersimpan dalam satu sistem agar lebih mudah dikelola.',
    icon: ClipboardList,
  },
  {
    title: 'Proses Terdokumentasi',
    description: 'Setiap tahapan bimbingan dapat dicatat dan ditinjau kembali saat dibutuhkan.',
    icon: FileCheck2,
  },
  {
    title: 'Validasi Lebih Jelas',
    description: 'Status pengajuan dan validasi dapat dipantau secara lebih transparan.',
    icon: ShieldCheck,
  },
  {
    title: 'Progress Mudah Dipantau',
    description: 'Mahasiswa dan dosen dapat melihat perkembangan proses bimbingan dengan lebih praktis.',
    icon: BookOpenCheck,
  },
];

const FEATURES = [
  {
    title: 'Registrasi Akun',
    description: 'Pengguna dapat membuat akun sesuai peran akademik yang dimiliki.',
    icon: UserPlus,
  },
  {
    title: 'Pemilihan Track',
    description: 'Mahasiswa dapat memilih jalur proyek atau internship sesuai kebutuhan akademik.',
    icon: Route,
  },
  {
    title: 'Pengajuan Proposal',
    description: 'Proposal dapat diajukan melalui sistem agar proses administrasi lebih terstruktur.',
    icon: FileText,
  },
  {
    title: 'Validasi Pengelola',
    description: 'Pengelola prodi dapat memeriksa dan memvalidasi data pengajuan mahasiswa.',
    icon: ShieldCheck,
  },
  {
    title: 'Bimbingan Online',
    description: 'Dosen dan mahasiswa dapat mencatat proses bimbingan secara lebih terdokumentasi.',
    icon: MessagesSquare,
  },
  {
    title: 'Riwayat dan Monitoring',
    description: 'Aktivitas bimbingan dapat dipantau melalui riwayat dan status yang tersimpan.',
    icon: ClipboardList,
  },
];

const ROLES = [
  {
    badge: 'Mahasiswa',
    title: 'Kelola proses akademik dengan langkah yang jelas.',
    icon: GraduationCap,
    items: ['Mengajukan proposal', 'Melihat status validasi', 'Mencatat proses bimbingan', 'Memantau progress akademik'],
  },
  {
    badge: 'Dosen Pembimbing',
    title: 'Dampingi mahasiswa dengan informasi yang tertata.',
    icon: Users,
    items: ['Melihat daftar mahasiswa bimbingan', 'Memberi arahan dan catatan', 'Memantau perkembangan mahasiswa', 'Meninjau riwayat bimbingan'],
  },
  {
    badge: 'Pengelola Prodi',
    title: 'Jaga alur akademik tetap rapi dan terpantau.',
    icon: Landmark,
    items: ['Memvalidasi data pengajuan', 'Mengelola alur akademik', 'Memantau rekap proses bimbingan', 'Menjaga proses administrasi tetap rapi'],
  },
];

const STEPS = [
  { title: 'Registrasi', description: 'Pengguna membuat akun sesuai peran akademik.' },
  { title: 'Pilih Track', description: 'Mahasiswa memilih jalur proyek atau internship.' },
  { title: 'Ajukan Proposal', description: 'Mahasiswa mengirimkan proposal melalui sistem.' },
  { title: 'Validasi', description: 'Pengelola memeriksa dan memvalidasi pengajuan.' },
  { title: 'Bimbingan', description: 'Mahasiswa dan dosen menjalankan sesi bimbingan.' },
  { title: 'Monitoring', description: 'Progress bimbingan dapat dipantau melalui sistem.' },
];

const BENEFITS = [
  {
    title: 'Mengurangi proses manual',
    description: 'Dokumen, status, dan catatan bimbingan dapat dikelola dalam satu tempat.',
  },
  {
    title: 'Memudahkan koordinasi',
    description: 'Mahasiswa, dosen, dan pengelola dapat mengikuti proses yang sama secara lebih jelas.',
  },
  {
    title: 'Meningkatkan transparansi',
    description: 'Status pengajuan dan progress bimbingan lebih mudah dilihat.',
  },
  {
    title: 'Membantu dokumentasi akademik',
    description: 'Riwayat proses bimbingan tersimpan sehingga lebih mudah ditinjau kembali.',
  },
];

function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="text-sm font-bold uppercase tracking-normal text-[hsl(var(--ctp-blue))]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-[hsl(var(--ctp-text))] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-[hsl(var(--ctp-subtext0))] sm:text-lg">{description}</p>
    </div>
  );
}

function PrimaryLink({ href, children, className = '' }) {
  return (
    <Button
      asChild
      size="lg"
      className={`h-12 rounded-xl bg-[hsl(var(--ctp-blue))] px-6 text-white shadow-sm hover:-translate-y-0.5 hover:bg-[hsl(var(--ctp-blue)/0.9)] hover:shadow-md ${className}`}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

function SecondaryLink({ href, children, className = '' }) {
  return (
    <Button
      asChild
      variant="outline"
      size="lg"
      className={`h-12 rounded-xl border-[hsl(var(--ctp-surface2))] bg-[hsl(var(--ctp-base))] px-6 text-[hsl(var(--ctp-text))] shadow-sm hover:-translate-y-0.5 hover:border-[hsl(var(--ctp-blue)/0.4)] hover:bg-[hsl(var(--ctp-blue)/0.1)] hover:text-[hsl(var(--ctp-blue))] ${className}`}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

function Reveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="relative min-h-screen overflow-x-clip bg-[hsl(var(--ctp-base))] text-[hsl(var(--ctp-text))] selection:bg-[hsl(var(--ctp-blue)/0.2)] selection:text-[hsl(var(--ctp-text))]">
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.9)] backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Kavana, kembali ke beranda">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[hsl(var(--ctp-blue)/0.2)] bg-[hsl(var(--ctp-blue)/0.1)]">
              <Image src="/D4TI.png" alt="Logo D4 Teknik Informatika ULBI" width={32} height={32} className="h-8 w-8 object-contain" priority />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-bold leading-6 tracking-normal text-[hsl(var(--ctp-text))]">Kavana</span>
              <span className="block truncate text-xs text-[hsl(var(--ctp-subtext0))]">Sistem Bimbingan Online</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-semibold text-[hsl(var(--ctp-subtext0))] transition-colors hover:text-[hsl(var(--ctp-blue))]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden h-11 rounded-xl px-4 text-[hsl(var(--ctp-subtext1))] hover:bg-[hsl(var(--ctp-blue)/0.1)] hover:text-[hsl(var(--ctp-blue))] sm:inline-flex">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild className="hidden h-11 rounded-xl bg-[hsl(var(--ctp-blue))] px-5 text-white shadow-sm hover:bg-[hsl(var(--ctp-blue)/0.9)] sm:inline-flex">
              <Link href="/register">Daftar</Link>
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              className="rounded-xl border-[hsl(var(--ctp-surface2))] bg-[hsl(var(--ctp-base))] text-[hsl(var(--ctp-subtext1))] hover:bg-[hsl(var(--ctp-blue)/0.1)] hover:text-[hsl(var(--ctp-blue))] lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-navigation" className="border-t border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] px-4 py-4 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Navigasi mobile">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-[hsl(var(--ctp-subtext1))] transition-colors hover:bg-[hsl(var(--ctp-blue)/0.1)] hover:text-[hsl(var(--ctp-blue))]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[hsl(var(--ctp-surface1))] pt-4">
                <SecondaryLink href="/login" className="w-full">Masuk</SecondaryLink>
                <PrimaryLink href="/register" className="w-full">Daftar</PrimaryLink>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[hsl(var(--ctp-blue)/0.15)] bg-gradient-to-br from-[hsl(var(--ctp-sky)/0.08)] via-[hsl(var(--ctp-base))] to-[hsl(var(--ctp-blue)/0.08)]">
          <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:py-20">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ctp-blue)/0.25)] bg-[hsl(var(--ctp-base))] px-4 py-2 text-sm font-semibold text-[hsl(var(--ctp-blue))] shadow-sm">
                <Landmark className="h-4 w-4" />
                Portal Akademik D4TI ULBI
              </div>
              <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-[1.12] tracking-normal text-[hsl(var(--ctp-text))] sm:text-5xl lg:text-6xl">
                Bimbingan Akademik Lebih Mudah, Terarah, dan Transparan
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[hsl(var(--ctp-subtext0))] sm:text-lg">
                Kavana membantu mahasiswa, dosen pembimbing, dan pengelola prodi dalam mengelola proses bimbingan akademik secara
                terstruktur, terdokumentasi, dan mudah dipantau.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/register" className="w-full sm:w-auto">
                  Daftar Akun
                  <ArrowRight className="h-4 w-4" />
                </PrimaryLink>
                <SecondaryLink href="/login" className="w-full sm:w-auto">Masuk Sistem</SecondaryLink>
              </div>
              <div className="mt-9 flex flex-col gap-3 text-sm text-[hsl(var(--ctp-subtext0))] sm:flex-row sm:gap-6">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(var(--ctp-green))]" />Alur akademik terdokumentasi</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(var(--ctp-green))]" />Informasi mudah dipantau</span>
              </div>
            </Reveal>

            <Reveal className="relative mx-auto w-full max-w-xl" delay={0.1}>
              <div className="rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] p-4 shadow-xl shadow-[hsl(var(--ctp-blue)/0.1)] sm:p-6">
                <div className="flex items-center justify-between gap-4 border-b border-[hsl(var(--ctp-surface1))] pb-5">
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--ctp-blue))]">Portal Mahasiswa</p>
                    <h2 className="mt-1 text-xl font-bold tracking-normal text-[hsl(var(--ctp-text))]">Ringkasan Bimbingan</h2>
                  </div>
                  <Badge className="border border-[hsl(var(--ctp-green)/0.3)] bg-[hsl(var(--ctp-green)/0.12)] px-3 py-1 text-[hsl(var(--ctp-green))]">
                    Aktif
                  </Badge>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-surface0))] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--ctp-blue)/0.15)] text-[hsl(var(--ctp-blue))]"><FileText className="h-5 w-5" /></span>
                      <Badge className="bg-[hsl(var(--ctp-peach)/0.15)] px-2.5 py-1 text-[hsl(var(--ctp-peach))]">
                        Diproses
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[hsl(var(--ctp-text))]">Status Proposal</p>
                    <p className="mt-1 text-sm text-[hsl(var(--ctp-subtext0))]">Menunggu Validasi</p>
                  </div>
                  <div className="rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-surface0))] p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--ctp-sky)/0.15)] text-[hsl(var(--ctp-sky))]"><CalendarDays className="h-5 w-5" /></span>
                    <p className="mt-4 text-sm font-semibold text-[hsl(var(--ctp-text))]">Jadwal Bimbingan</p>
                    <p className="mt-1 text-sm text-[hsl(var(--ctp-subtext0))]">Sesi berikutnya tersedia</p>
                  </div>
                  <div className="rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-surface0))] p-4 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">Progress Akademik</p>
                        <p className="mt-1 text-sm text-[hsl(var(--ctp-subtext0))]">Tahap pengajuan proposal</p>
                      </div>
                      <Route className="h-5 w-5 text-[hsl(var(--ctp-blue))]" />
                    </div>
                    <Progress
                      value={40}
                      aria-label="Progress berada pada tahap pengajuan proposal"
                      className="mt-4 bg-[hsl(var(--ctp-surface1))] [&_[data-slot=progress-indicator]]:bg-[hsl(var(--ctp-blue))]"
                    />
                  </div>
                  <div className="rounded-2xl border border-[hsl(var(--ctp-blue)/0.2)] bg-[hsl(var(--ctp-blue)/0.1)] p-4 sm:col-span-2">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--ctp-base))] text-[hsl(var(--ctp-blue))] shadow-sm"><MessagesSquare className="h-5 w-5" /></span>
                      <div>
                        <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">Catatan Dosen</p>
                        <p className="mt-1 text-sm leading-6 text-[hsl(var(--ctp-subtext0))]">Belum ada catatan baru</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section aria-label="Keunggulan Kavana" className="bg-[hsl(var(--ctp-base))] py-14">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {HIGHLIGHTS.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] p-5 shadow-sm transition hover:-translate-y-1 hover:border-[hsl(var(--ctp-blue)/0.3)] hover:shadow-md">
                <Icon className="h-5 w-5 text-[hsl(var(--ctp-blue))]" />
                <h2 className="mt-4 text-base font-bold tracking-normal text-[hsl(var(--ctp-text))]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--ctp-subtext0))]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="fitur" className="scroll-mt-20 border-y border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-mantle))] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Fitur"
              title="Fitur Utama Kavana"
              description="Dirancang untuk membantu proses bimbingan akademik menjadi lebih rapi, jelas, dan mudah dipantau."
            />
            <Reveal className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ title, description, icon: Icon }) => (
                <article key={title} className="group rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[hsl(var(--ctp-blue)/0.3)] hover:shadow-md">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[hsl(var(--ctp-blue)/0.1)] text-[hsl(var(--ctp-blue))] transition-colors group-hover:bg-[hsl(var(--ctp-blue))] group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-normal text-[hsl(var(--ctp-text))]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">{description}</p>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        <section id="peran" className="scroll-mt-20 bg-[hsl(var(--ctp-base))] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              centered
              eyebrow="Peran Pengguna"
              title="Satu Sistem untuk Beberapa Peran Akademik"
              description="Kavana membantu setiap pengguna menjalankan tugasnya dengan alur yang lebih jelas."
            />
            <Reveal className="mt-12 grid gap-6 lg:grid-cols-3">
              {ROLES.map(({ badge, title, icon: Icon, items }) => (
                <article key={badge} className="rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[hsl(var(--ctp-blue)/0.3)] hover:shadow-md sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full border border-[hsl(var(--ctp-blue)/0.25)] bg-[hsl(var(--ctp-blue)/0.1)] px-3 py-1 text-xs font-bold text-[hsl(var(--ctp-blue))]">{badge}</span>
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-[hsl(var(--ctp-sky)/0.15)] text-[hsl(var(--ctp-sky))]"><Icon className="h-6 w-6" /></span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold leading-8 tracking-normal text-[hsl(var(--ctp-text))]">{title}</h3>
                  <ul className="mt-6 space-y-3">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[hsl(var(--ctp-subtext0))]">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]"><Check className="h-3.5 w-3.5" /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        <section id="alur" className="scroll-mt-20 border-y border-[hsl(var(--ctp-surface1))] bg-gradient-to-b from-[hsl(var(--ctp-sky)/0.08)] to-[hsl(var(--ctp-base))] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Alur Bimbingan"
              title="Alur Bimbingan yang Lebih Terarah"
              description="Setiap proses dibuat bertahap agar mahasiswa, dosen, dan pengelola prodi dapat mengikuti alur dengan lebih mudah."
            />
            <ol className="relative mt-12 grid gap-5 lg:grid-cols-6 lg:gap-3">
              <div className="absolute left-[8.33%] right-[8.33%] top-6 hidden h-px bg-[hsl(var(--ctp-blue)/0.3)] lg:block" aria-hidden="true" />
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative flex gap-4 rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] p-5 shadow-sm lg:block lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                  <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-[hsl(var(--ctp-sky)/0.15)] bg-[hsl(var(--ctp-blue))] text-sm font-bold text-white shadow-sm">
                    {index + 1}
                  </span>
                  <div className="lg:mt-5">
                    <h3 className="text-base font-bold tracking-normal text-[hsl(var(--ctp-text))]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[hsl(var(--ctp-subtext0))]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-[hsl(var(--ctp-base))] py-20 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:px-8">
            <SectionHeading
              eyebrow="Manfaat"
              title="Mengapa Kavana Dibutuhkan?"
              description="Satu ruang kerja akademik membantu proses bimbingan lebih mudah dipahami, dijalankan, dan ditinjau kembali."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((benefit, index) => (
                <article key={benefit.title} className="rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-surface0))] p-6">
                  <span className="text-sm font-bold text-[hsl(var(--ctp-blue))]">0{index + 1}</span>
                  <h3 className="mt-4 text-lg font-bold tracking-normal text-[hsl(var(--ctp-text))]">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[hsl(var(--ctp-base))] pb-20 lg:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="overflow-hidden rounded-3xl border border-[hsl(var(--ctp-blue)/0.25)] bg-gradient-to-br from-[hsl(var(--ctp-blue)/0.1)] via-[hsl(var(--ctp-base))] to-[hsl(var(--ctp-sky)/0.12)] px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-12 lg:py-12">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-normal text-[hsl(var(--ctp-blue))]">Mulai Menggunakan Kavana</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-[hsl(var(--ctp-text))] sm:text-4xl">
                  Mulai kelola bimbingan akademik dengan lebih terstruktur.
                </h2>
                <p className="mt-4 text-base leading-8 text-[hsl(var(--ctp-subtext0))]">
                  Gunakan Kavana untuk membantu proses bimbingan menjadi lebih rapi, terdokumentasi, dan mudah dipantau.
                </p>
              </div>
              <div className="mt-8 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col xl:flex-row">
                <PrimaryLink href="/register" className="w-full xl:w-auto">Daftar Sekarang</PrimaryLink>
                <SecondaryLink href="/login" className="w-full xl:w-auto">Masuk ke Sistem</SecondaryLink>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer id="kontak" className="scroll-mt-20 border-t border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-mantle))] text-[hsl(var(--ctp-subtext0))]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))]">
                <Image src="/D4TI.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
              </span>
              <div>
                <p className="text-lg font-bold tracking-normal text-[hsl(var(--ctp-text))]">Kavana</p>
                <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Sistem Bimbingan Online</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">Program Studi D4 Teknik Informatika ULBI</p>
            <p className="mt-2 max-w-md text-sm leading-7 text-[hsl(var(--ctp-subtext0))]">{CAMPUS_CONTACT.address}</p>
          </div>

          <div>
            <p className="text-sm font-bold text-[hsl(var(--ctp-text))]">Navigasi</p>
            <nav className="mt-4 grid grid-cols-2 gap-3" aria-label="Navigasi footer">
              {NAV_ITEMS.map((item) => (
                <a key={item.label} href={item.href} className="text-sm text-[hsl(var(--ctp-subtext0))] transition-colors hover:text-[hsl(var(--ctp-blue))]">{item.label}</a>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-sm font-bold text-[hsl(var(--ctp-text))]">Kontak Prodi</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[hsl(var(--ctp-subtext0))]">
              <p>{CAMPUS_CONTACT.email}</p>
              <p>{CAMPUS_CONTACT.phone}</p>
              <p>{CAMPUS_CONTACT.officeHours}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-[hsl(var(--ctp-surface1))] px-4 py-5 text-center text-sm text-[hsl(var(--ctp-subtext0))]">
          © 2026 Kavana. Program Studi D4 Teknik Informatika ULBI.
        </div>
      </footer>
      </div>
    </MotionConfig>
  );
}
