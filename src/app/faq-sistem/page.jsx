import ResourcePageShell from '@/components/public/resource-page-shell';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const metadata = {
  title: 'FAQ Sistem - Kavana',
  description: 'Pertanyaan yang sering diajukan terkait penggunaan sistem Kavana.',
};

const FAQ_ITEMS = [
  {
    question: 'Apakah mahasiswa wajib memilih track sebelum mengajukan proposal?',
    answer:
      'Ya. Pemilihan track (Proyek 1, Proyek 2, Proyek 3, atau Internship) wajib dilakukan sebelum pengajuan proposal agar alur validasi, pedoman dokumen, dan penugasan dosen pembimbing sesuai dengan ketentuan kurikulum.',
  },
  {
    question: 'Berapa minimal sesi bimbingan yang harus disetujui untuk maju sidang?',
    answer:
      'Mahasiswa wajib mengumpulkan minimal 8 sesi bimbingan yang telah disetujui (approved) oleh dosen pembimbing sebelum dapat mengajukan jadwal sidang.',
  },
  {
    question: 'Mengapa status bimbingan saya masih berstatus "Menunggu"?',
    answer:
      'Status menunggu (pending) menandakan catatan logbook bimbingan telah berhasil dikirimkan oleh mahasiswa, namun belum ditinjau dan divalidasi oleh dosen pembimbing terkait.',
  },
  {
    question: 'Bagaimana jika terdapat kesalahan pada berkas proposal atau laporan yang telah diunggah?',
    answer:
      'Jika status dokumen masih dalam tahap revisi atau belum divalidasi, Anda dapat mengunggah ulang berkas perbaikan melalui menu yang tersedia. Jika status sudah terkunci, hubungi koordinator program studi.',
  },
  {
    question: 'Apakah koordinator dan kaprodi dapat memantau seluruh proses bimbingan mahasiswa?',
    answer:
      'Ya. Koordinator dan kaprodi memiliki hak akses monitoring menyeluruh untuk melihat persebaran bimbingan, status proposal, kesiapan sidang, dan kelulusan revisi seluruh angkatan.',
  },
];

export default function FaqSistemPage() {
  return (
    <ResourcePageShell
      title="FAQ Sistem"
      subtitle="Daftar pertanyaan dan jawaban umum seputar operasional platform bimbingan akademik Kavana."
      updatedLabel="26 Februari 2026"
    >
      <Accordion
        type="single"
        collapsible
        className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-4"
      >
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`faq-${index + 1}`}
            className="border-b border-[var(--line)] last:border-b-0 py-1"
          >
            <AccordionTrigger className="text-left text-sm font-semibold text-[var(--text-strong)] hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-[var(--text-body)]">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ResourcePageShell>
  );
}
