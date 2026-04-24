'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  BookOpen,
  CircleHelp,
  Mail,
  MessageSquareText,
  Copy,
  CheckCircle2,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { ROLE_DASHBOARD_ROUTE } from '@/lib/constants';

const cardCls = 'bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Kenapa saya tidak bisa upload proposal/laporan?',
    answer:
      'Pastikan format file sesuai ketentuan, ukuran file tidak melebihi batas, dan koneksi internet stabil. Jika tetap gagal, hubungi helpdesk dengan menyertakan pesan error.',
  },
  {
    id: 'faq-2',
    question: 'Notifikasi tidak muncul, apa yang harus dicek?',
    answer:
      'Notifikasi muncul jika ada status data yang perlu ditindaklanjuti. Coba tekan tombol muat ulang notifikasi di ikon lonceng dan pastikan akun Anda memiliki item pending/revisi.',
  },
  {
    id: 'faq-3',
    question: 'Bagaimana cara ganti password akun?',
    answer:
      'Buka menu Settings, lalu isi password lama dan password baru. Gunakan kombinasi password yang kuat minimal 6 karakter.',
  },
  {
    id: 'faq-4',
    question: 'Saya login tapi diarahkan ke dashboard lain, kenapa?',
    answer:
      'Halaman dashboard ditentukan oleh role akun Anda (mahasiswa, dosen, koordinator, kaprodi, admin). Pastikan akun yang dipakai sudah sesuai peran.',
  },
];

export default function SupportPage() {
  const role = useAuthStore((s) => s.role);
  const [copied, setCopied] = useState(false);

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@kavanahub.id';
  const roleDashboardHref = ROLE_DASHBOARD_ROUTE[role] || '/dashboard';

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`[Kavana] Bantuan ${role || 'user'}`);
    const body = encodeURIComponent(
      [
        'Halo tim support,',
        '',
        'Saya butuh bantuan terkait:',
        '- ',
        '',
        'Role: ' + (role || '-'),
        'Halaman: ',
        'Waktu kejadian: ',
        '',
        'Terima kasih.',
      ].join('\n')
    );
    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }, [role, supportEmail]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      toast.success('Email support berhasil disalin');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Gagal menyalin email support');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[hsl(var(--ctp-subtext0))]">
            <LifeBuoy className="h-3.5 w-3.5" />
            Pusat Bantuan
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--ctp-text))]">Support</h1>
          <p className="mt-1 text-sm text-[hsl(var(--ctp-subtext0))]">
            Bantuan cepat, FAQ, dan kanal kontak jika Anda mengalami kendala.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0)/0.45)] text-[hsl(var(--ctp-text))]"
        >
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4 mr-2" />
            Buka Settings
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className={`${cardCls} lg:col-span-2`}>
          <CardHeader>
            <CardTitle className="text-[hsl(var(--ctp-text))] flex items-center gap-2">
              <CircleHelp className="h-4 w-4" />
              Pertanyaan Umum
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
              Jawaban untuk kendala yang paling sering terjadi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-[hsl(var(--ctp-overlay0)/0.35)]">
                  <AccordionTrigger className="text-[hsl(var(--ctp-text))] hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[hsl(var(--ctp-subtext0))] leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardHeader>
            <CardTitle className="text-[hsl(var(--ctp-text))] flex items-center gap-2">
              <MessageSquareText className="h-4 w-4" />
              Hubungi Support
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
              Jika masih ada masalah, gunakan kanal berikut.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start rounded-xl bg-[hsl(var(--ctp-lavender)/0.2)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.3)] border border-[hsl(var(--ctp-lavender)/0.35)]">
              <a href={mailtoHref}>
                <Mail className="h-4 w-4 mr-2" />
                Kirim Email
              </a>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyEmail}
              className="w-full justify-start rounded-xl border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0)/0.45)] text-[hsl(var(--ctp-text))]"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 mr-2 text-[hsl(var(--ctp-green))]" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Email Tersalin' : 'Salin Email Support'}
            </Button>

            <div className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] px-3 py-2">
              <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Email support</p>
              <p className="text-sm text-[hsl(var(--ctp-text))] mt-0.5 break-all">{supportEmail}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={cardCls}>
        <CardHeader>
          <CardTitle className="text-[hsl(var(--ctp-text))] flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Resource Cepat
          </CardTitle>
          <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
            Dokumen panduan dan halaman penting untuk troubleshooting mandiri.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            asChild
            variant="outline"
            className="justify-between rounded-xl border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0)/0.45)] text-[hsl(var(--ctp-text))]"
          >
            <Link href="/panduan-pengguna">
              Panduan Pengguna
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="justify-between rounded-xl border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0)/0.45)] text-[hsl(var(--ctp-text))]"
          >
            <Link href="/faq-sistem">
              FAQ Sistem
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="justify-between rounded-xl border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0)/0.45)] text-[hsl(var(--ctp-text))]"
          >
            <Link href={roleDashboardHref}>
              Kembali ke Dashboard
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
