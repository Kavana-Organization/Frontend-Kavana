'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CircleHelp,
  Mail,
  MessageCircle,
  Copy,
  CheckCircle2,
  ExternalLink,
  Settings,
  Search,
  Clock,
} from 'lucide-react';
import { toast } from '@/lib/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { CAMPUS_CONTACT, ROLE_DASHBOARD_ROUTE, ROLE_LABEL } from '@/lib/constants';

const GENERAL_FAQ_ITEMS = [
  {
    id: 'faq-1',
    category: 'Umum',
    question: 'Kenapa saya tidak bisa upload proposal atau laporan?',
    answer:
      'Pastikan format file dan tautan dokumen sesuai ketentuan, ukuran file tidak melebihi batas, dan koneksi internet stabil. Jika tetap gagal, hubungi tim support dengan menyertakan pesan error.',
  },
  {
    id: 'faq-2',
    category: 'Umum',
    question: 'Notifikasi tidak muncul, apa yang harus dicek?',
    answer:
      'Notifikasi muncul jika ada status data yang perlu ditindaklanjuti. Coba muat ulang daftar notifikasi melalui ikon lonceng di bilah atas dan pastikan akun Anda memiliki item pending atau revisi.',
  },
  {
    id: 'faq-3',
    category: 'Akun',
    question: 'Bagaimana cara ganti password akun?',
    answer:
      'Buka menu Pengaturan, lalu isi password lama dan password baru. Gunakan kombinasi password yang kuat minimal 6 karakter.',
  },
  {
    id: 'faq-4',
    category: 'Akun',
    question: 'Saya login tetapi diarahkan ke dashboard peran lain, kenapa?',
    answer:
      'Halaman dashboard ditentukan oleh peran akun Anda (mahasiswa, dosen, penguji, koordinator, kaprodi, admin, atau developer). Pastikan akun yang digunakan sesuai peran yang dimaksud.',
  },
];

const ROLE_FAQ_ITEMS = {
  mahasiswa: [
    {
      id: 'faq-mhs-1',
      category: 'Mahasiswa',
      question: 'Kapan saya harus memilih track dan membentuk kelompok?',
      answer:
        'Pilih jalur Proyek atau Internship pada menu Proyek & Internship sebelum mengajukan proposal. Untuk jalur Proyek berkelompok, buat atau gabung kelompok melalui kode undangan pada menu Kelompok Proyek.',
    },
    {
      id: 'faq-mhs-2',
      category: 'Mahasiswa',
      question: 'Berapa minimal sesi bimbingan yang disetujui untuk maju sidang?',
      answer:
        'Anda memerlukan minimal 8 sesi bimbingan yang telah berstatus disetujui oleh dosen pembimbing sebelum mengunggah laporan sidang dan dijadwalkan mengikuti sidang.',
    },
    {
      id: 'faq-mhs-3',
      category: 'Mahasiswa',
      question: 'Bagaimana cara menyelesaikan revisi setelah sidang?',
      answer:
        'Buka menu Revisi Sidang setelah nilai/hasil sidang keluar, unggah tautan dokumen perbaikan sesuai catatan penguji, lalu tunggu persetujuan dosen pembimbing.',
    },
  ],
  dosen: [
    {
      id: 'faq-dosen-1',
      category: 'Dosen Pembimbing',
      question: 'Bagaimana cara menyetujui atau menolak logbook bimbingan mahasiswa?',
      answer:
        'Buka menu Approve Bimbingan, pilih baris sesi yang berstatus menunggu untuk meninjau catatan dan bukti bimbingan di panel detail, lalu pilih Setujui atau Tolak beserta catatan revisi.',
    },
    {
      id: 'faq-dosen-2',
      category: 'Dosen Pembimbing',
      question: 'Mengapa saya diminta mengisi Kode Dosen dan NIK di Profil?',
      answer:
        'Kode Dosen dan NIK digunakan untuk melengkapi identitas resmi pada tanda tangan QR formulir bimbingan yang Anda setujui. Pada halaman verifikasi publik, NIK ditampilkan dalam bentuk tersembunyi.',
    },
  ],
  penguji: [
    {
      id: 'faq-penguji-1',
      category: 'Dosen Penguji',
      question: 'Di mana saya melihat jadwal sidang dan dokumen laporan mahasiswa?',
      answer:
        'Buka menu Sidang Penguji untuk melihat daftar jadwal sidang yang ditugaskan kepada Anda, mengunduh berkas laporan, serta mengisi nilai dan catatan revisi pada panel penilaian.',
    },
    {
      id: 'faq-penguji-2',
      category: 'Dosen Penguji',
      question: 'Apakah penguji juga memiliki akses fitur Dosen Pembimbing?',
      answer:
        'Ya. Kelompok menu Dosen Pembimbing di sidebar tetap tersedia apabila Anda juga membimbing mahasiswa pada periode berjalan.',
    },
  ],
  koordinator: [
    {
      id: 'faq-koor-1',
      category: 'Koordinator',
      question: 'Apa urutan validasi proposal hingga penjadwalan sidang?',
      answer:
        'Pastikan periode akademik aktif telah dibuka di Kelola Periode, lanjutkan pemeriksaan proposal di Validasi Proposal, tetapkan pembimbing di Assign Pembimbing, lalu atur jadwal penguji pada Jadwal Sidang.',
    },
    {
      id: 'faq-koor-2',
      category: 'Koordinator',
      question: 'Bagaimana memantau mahasiswa yang belum memenuhi syarat bimbingan?',
      answer:
        'Gunakan menu Daftar Mahasiswa dan Monitoring Revisi untuk memeriksa jumlah sesi bimbingan yang disetujui, status laporan, dan progres perbaikan pascasidang.',
    },
  ],
  kaprodi: [
    {
      id: 'faq-kaprodi-1',
      category: 'Kepala Prodi',
      question: 'Bagaimana cara mengatur peran Koordinator atau otoritas operasional?',
      answer:
        'Buka menu Kelola Koordinator untuk menetapkan dosen yang bertugas sebagai koordinator pada periode aktif serta mengatur visibilitas kewenangan koordinator.',
    },
    {
      id: 'faq-kaprodi-2',
      category: 'Kepala Prodi',
      question: 'Di mana melihat rekap beban bimbingan dosen dan progres mahasiswa?',
      answer:
        'Menu Daftar Dosen menampilkan daftar pembimbing beserta distribusi mahasiswa bimbingan, sedangkan Monitoring Mahasiswa menyajikan ringkasan kemajuan akademik per angkatan.',
    },
  ],
  admin: [
    {
      id: 'faq-admin-1',
      category: 'Administrator',
      question: 'Bagaimana cara mengaktifkan atau menonaktifkan akun pengguna?',
      answer:
        'Buka menu Kelola Users, gunakan filter peran atau pencarian untuk menemukan akun, lalu perbarui status aktif atau data profil pengguna sesuai kebutuhan.',
    },
    {
      id: 'faq-admin-2',
      category: 'Administrator',
      question: 'Bagaimana membaca riwayat perubahan dan aktivitas sistem?',
      answer:
        'Gunakan menu Monitoring Sistem untuk memeriksa catatan audit aktivitas admin, detail perubahan dalam format key-value, serta data JSON mentah bila diperlukan.',
    },
  ],
  developer: [
    {
      id: 'faq-dev-1',
      category: 'Developer',
      question: 'Bagaimana memeriksa status database, Redis, dan layanan keamanan?',
      answer:
        'Buka Developer Center atau System Health untuk memantau latensi database, koneksi Redis, konfigurasi runtime, serta menjalankan synthetic test.',
    },
    {
      id: 'faq-dev-2',
      category: 'Developer',
      question: 'Kapan perlu mencabut perangkat (Device Lock) atau membersihkan cache Redis?',
      answer:
        'Cabut perangkat di menu Device Lock apabila sesi perangkat tidak lagi digunakan, dan bersihkan prefix di Redis Cache saat diperlukan sinkronisasi ulang cache endpoint.',
    },
  ],
};

export default function SupportPage() {
  const role = useAuthStore((s) => s.role);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || CAMPUS_CONTACT.email;
  const waDisplay = CAMPUS_CONTACT.phone;
  const waDigits = waDisplay.replace(/\D/g, '');
  const roleLabel = ROLE_LABEL[role] || role || 'Pengguna';
  const roleDashboardHref = ROLE_DASHBOARD_ROUTE[role] || '/dashboard';

  const roleSpecificFaqs = useMemo(() => {
    return ROLE_FAQ_ITEMS[role] || [];
  }, [role]);

  const allFaqs = useMemo(() => {
    return [...roleSpecificFaqs, ...GENERAL_FAQ_ITEMS];
  }, [roleSpecificFaqs]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allFaqs;
    return allFaqs.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allFaqs, searchQuery]);

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

  const waHref = useMemo(() => {
    const text = encodeURIComponent(
      `Halo tim support Kavana, saya (${roleLabel}) membutuhkan bantuan terkait penggunaan sistem.`
    );
    return `https://wa.me/${waDigits}?text=${text}`;
  }, [roleLabel, waDigits]);

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
    <div className="space-y-6">
      <PageHeader
        title="Pusat Bantuan"
        subtitle="Cari jawaban FAQ sesuai peran Anda atau hubungi kanal dukungan resmi."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span>Buka Pengaturan</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================== SEARCHABLE FAQ ===================== */}
        <Card variant="muted" className="lg:col-span-7 min-w-0 bg-[var(--surface-raised)]">
          <CardHeader className="border-b border-[var(--line)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleHelp className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Pertanyaan Umum (FAQ)</span>
              </CardTitle>
              <span className="inline-flex items-center rounded-md border border-[var(--line)] bg-[var(--surface-sunken)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                Peran: {roleLabel}
              </span>
            </div>
            <CardDescription>
              Menampilkan panduan khusus {roleLabel} dan pertanyaan umum sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Cari Pertanyaan (FAQ)">
              {(a11y) => (
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <Input
                    {...a11y}
                    name="faqSearch"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kata kunci, mis. bimbingan, password, sidang..."
                    className="pl-9"
                  />
                </div>
              )}
            </Field>

            {filteredFaqs.length === 0 ? (
              <EmptyState
                icon={CircleHelp}
                title="Pertanyaan tidak ditemukan"
                description="Tidak ada topik FAQ yang cocok dengan kata kunci pencarian Anda."
                action={
                  <Button type="button" variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    Reset Pencarian
                  </Button>
                }
              />
            ) : (
              <Accordion type="single" collapsible className="w-full" data-testid="support-faq-accordion">
                {filteredFaqs.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-[var(--text-strong)] hover:no-underline">
                      <span className="flex flex-col items-start gap-1 text-left min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          {item.category}
                        </span>
                        <span className="break-words">{item.question}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* ===================== CONTACT CARDS (EMAIL & WHATSAPP) ===================== */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
          <Card variant="muted" className="bg-[var(--surface-raised)]" data-testid="support-email-card">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Support Email</span>
              </CardTitle>
              <CardDescription>
                Sertakan peran, halaman kendala, dan tangkapan layar bila ada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 min-w-0">
                <p className="text-xs text-[var(--text-muted)]">Alamat Email</p>
                <p className="text-sm font-medium font-mono text-[var(--text-strong)] mt-0.5 break-all">
                  {supportEmail}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild className="flex-1">
                  <a href={mailtoHref}>
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span>Kirim Email</span>
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyEmail}
                  className="flex-1"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--ctp-green))]" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{copied ? 'Email Tersalin' : 'Salin Email Support'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="muted" className="bg-[var(--surface-raised)]" data-testid="support-whatsapp-card">
            <CardHeader className="border-b border-[var(--line)]">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Support WhatsApp</span>
              </CardTitle>
              <CardDescription>
                Konsultasi cepat pada jam operasional layanan akademik prodi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 space-y-1.5 min-w-0">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Nomor WhatsApp</p>
                  <p className="text-sm font-medium font-mono tabular-nums text-[var(--text-strong)] mt-0.5 break-words">
                    {waDisplay}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{CAMPUS_CONTACT.officeHours}</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Chat via WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5 ml-auto" aria-hidden="true" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===================== QUICK RESOURCES ===================== */}
      <Card variant="muted" className="bg-[var(--surface-raised)]">
        <CardHeader className="border-b border-[var(--line)]">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
            <span>Resource Cepat</span>
          </CardTitle>
          <CardDescription>
            Dokumen panduan dan halaman penting untuk troubleshooting mandiri.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button asChild variant="outline" className="justify-between">
            <Link href="/panduan-pengguna">
              <span>Panduan Pengguna</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-between">
            <Link href="/faq-sistem">
              <span>FAQ Sistem</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-between">
            <Link href={roleDashboardHref}>
              <span>Kembali ke Dashboard</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
