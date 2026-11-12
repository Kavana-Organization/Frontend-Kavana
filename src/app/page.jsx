'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  Landmark,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { motion, MotionConfig } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CAMPUS_CONTACT, LANDING_CONTENT } from '@/lib/constants';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="min-h-screen bg-[var(--surface-page)] text-[var(--text-body)] selection:bg-[var(--accent-soft)] selection:text-[var(--text-strong)]">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface-raised)]">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3" aria-label="Kavana, kembali ke beranda">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)]">
                <Image
                  src="/D4TI.png"
                  alt="Logo D4 Teknik Informatika ULBI"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                  priority
                />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold leading-tight tracking-tight text-[var(--text-strong)]">
                  {LANDING_CONTENT.brand.name}
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {LANDING_CONTENT.brand.subtitle}
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex" aria-label="Navigasi utama">
              {LANDING_CONTENT.nav.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-[var(--text-body)] hover:text-[var(--text-strong)]">
                <Link href={LANDING_CONTENT.hero.secondaryCta.href}>
                  {LANDING_CONTENT.hero.secondaryCta.label}
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90">
                <Link href={LANDING_CONTENT.hero.primaryCta.href}>
                  {LANDING_CONTENT.hero.primaryCta.label}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-body)] hover:bg-[var(--surface-sunken)] md:hidden"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div id="mobile-navigation" className="border-t border-[var(--line)] bg-[var(--surface-raised)] px-4 py-4 md:hidden">
              <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
                {LANDING_CONTENT.nav.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-body)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-3">
                  <Button asChild variant="outline" size="sm" className="w-full border-[var(--line)]">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Masuk</Link>
                  </Button>
                  <Button asChild size="sm" className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90">
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>Daftar</Link>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </header>

        <main>
          {/* Hero Section */}
          <section className="border-b border-[var(--line)] bg-[var(--surface-page)]">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14"
              >
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                    <Landmark className="h-3.5 w-3.5" />
                    <span>{LANDING_CONTENT.hero.badge}</span>
                  </div>

                  <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--text-strong)] sm:text-4xl lg:text-5xl leading-tight">
                    {LANDING_CONTENT.hero.title}
                  </h1>

                  <p className="mt-5 text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
                    {LANDING_CONTENT.hero.description}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button asChild size="lg" className="bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90">
                      <Link href={LANDING_CONTENT.hero.primaryCta.href}>
                        {LANDING_CONTENT.hero.primaryCta.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-strong)] hover:bg-[var(--surface-sunken)]">
                      <Link href={LANDING_CONTENT.hero.secondaryCta.href}>
                        {LANDING_CONTENT.hero.secondaryCta.label}
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                      Kurikulum resmi D4TI ULBI
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                      Logbook bimbingan tervalidasi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                      Alur sidang terdokumentasi
                    </span>
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-2 shadow-sm">
                    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)]">
                      <Image
                        src="/landing/mahasiswa.png"
                        alt="Tampilan antarmuka portal mahasiswa Kavana menunjukkan ringkasan bimbingan dan alur akademik"
                        width={1280}
                        height={800}
                        className="w-full h-auto object-cover"
                        priority
                        loading="eager"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Academic Pipeline Section */}
          <section id="alur" className="scroll-mt-16 border-b border-[var(--line)] bg-[var(--surface-page)] py-14 sm:py-18 lg:py-22">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Alur Akademik
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-strong)] sm:text-3xl">
                  Satu Rangkaian Proses Akademik yang Terukur
                </h2>
                <p className="mt-3 text-base text-[var(--text-muted)]">
                  Delapan tahapan akademik terintegrasi dari pendaftaran awal hingga revisi pascasidang dengan pembagian peran yang tegas.
                </p>
              </div>

              {/* Horizontal Pipeline */}
              <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                {LANDING_CONTENT.pipeline.map((item, index) => (
                  <div
                    key={item.stage}
                    className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--surface-sunken)] text-xs font-bold text-[var(--text-strong)]">
                          {index + 1}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-[var(--line)] text-[var(--accent)]">
                          Tahap {index + 1}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-[var(--text-strong)]">
                        {item.stage}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-4 border-t border-[var(--line)] pt-2.5">
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Peran Pelaksana
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-[var(--text-strong)]">
                        {item.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Role Tabs Section */}
          <section id="peran" className="scroll-mt-16 border-b border-[var(--line)] bg-[var(--surface-sunken)] py-14 sm:py-18 lg:py-22">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Peran Pengguna
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-strong)] sm:text-3xl">
                  Satu Platform untuk Seluruh Sivitas Akademika
                </h2>
                <p className="mt-3 text-base text-[var(--text-muted)]">
                  Setiap peran memiliki antarmuka khusus dengan fungsionalitas operasional yang disesuaikan dengan tanggung jawabnya.
                </p>
              </div>

              <div className="mt-8">
                <Tabs defaultValue="mahasiswa" className="w-full">
                  <TabsList className="mb-6 h-auto p-1 bg-[var(--surface-raised)] border border-[var(--line)]">
                    {LANDING_CONTENT.roleTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="px-4 py-2 text-sm font-semibold data-[state=active]:bg-[var(--accent)] data-[state=active]:text-white"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {LANDING_CONTENT.roleTabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="outline-none">
                      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-2 shadow-sm order-2 lg:order-1">
                          <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)]">
                            <Image
                              src={tab.screenshot}
                              alt={tab.screenshotAlt}
                              width={1280}
                              height={800}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        </div>

                        <div className="space-y-6 order-1 lg:order-2">
                          <div>
                            <Badge variant="outline" className="border-[var(--line)] text-xs text-[var(--accent)]">
                              Peran {tab.label}
                            </Badge>
                            <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--text-strong)] sm:text-2xl">
                              {tab.title}
                            </h3>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                              Kemampuan Utama
                            </p>
                            <ul className="space-y-2.5">
                              {tab.capabilities.map((cap) => (
                                <li key={cap} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--text-body)]">
                                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white">
                                    <Check className="h-3 w-3" />
                                  </span>
                                  <span>{cap}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2">
                            <Button asChild variant="outline" size="sm" className="border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-strong)] hover:bg-[var(--surface-sunken)]">
                              <Link href="/login">
                                Masuk ke Portal {tab.label}
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          </section>

          {/* FAQ Teaser Section */}
          <section id="faq" className="scroll-mt-16 border-b border-[var(--line)] bg-[var(--surface-page)] py-14 sm:py-18 lg:py-22">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    FAQ Sistem
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-strong)] sm:text-3xl">
                    {LANDING_CONTENT.faqTeaser.title}
                  </h2>
                  <p className="mt-2 text-base text-[var(--text-muted)]">
                    {LANDING_CONTENT.faqTeaser.description}
                  </p>
                </div>
                <div>
                  <Button asChild variant="outline" className="border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-strong)] hover:bg-[var(--surface-sunken)]">
                    <Link href={LANDING_CONTENT.faqTeaser.ctaHref}>
                      {LANDING_CONTENT.faqTeaser.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {LANDING_CONTENT.faqTeaser.items.map((item) => (
                  <article
                    key={item.q}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                      <HelpCircle className="h-4 w-4" />
                      <span>Pertanyaan Akademik</span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-[var(--text-strong)]">
                      {item.q}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                      {item.a}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer id="kontak" className="border-t border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-body)]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {/* Col 1: Brand & Campus Contact */}
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)]">
                  <Image src="/D4TI.png" alt="Logo D4TI" width={28} height={28} className="h-7 w-7 object-contain" />
                </span>
                <div>
                  <p className="text-base font-bold text-[var(--text-strong)]">Kavana</p>
                  <p className="text-xs text-[var(--text-muted)]">Sistem Bimbingan Online</p>
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold text-[var(--text-strong)]">
                Program Studi D4 Teknik Informatika ULBI
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                {CAMPUS_CONTACT.address}
              </p>
              <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
                <p>Email: <a href={`mailto:${CAMPUS_CONTACT.email}`} className="hover:underline">{CAMPUS_CONTACT.email}</a></p>
                <p>Telp / WA: {CAMPUS_CONTACT.phone}</p>
                <p>Jam Layanan: {CAMPUS_CONTACT.officeHours}</p>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-strong)]">
                Navigasi
              </p>
              <nav className="mt-3 flex flex-col gap-2" aria-label="Navigasi footer">
                {LANDING_CONTENT.nav.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Col 3: Portal Access */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-strong)]">
                Akses Portal
              </p>
              <nav className="mt-3 flex flex-col gap-2" aria-label="Portal pengguna">
                {LANDING_CONTENT.footer.platformLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Col 4: Public Resources & Project Outputs */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-strong)]">
                Informasi & Luaran
              </p>
              <nav className="mt-3 flex flex-col gap-2" aria-label="Halaman publik dan luaran proyek">
                {LANDING_CONTENT.footer.resourceLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="border-t border-[var(--line)] px-4 py-4 text-center text-xs text-[var(--text-muted)]">
            {LANDING_CONTENT.footer.copyright}
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
