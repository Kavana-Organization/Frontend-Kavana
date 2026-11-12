import ResourcePageShell from '@/components/public/resource-page-shell';

export const metadata = {
  title: 'Panduan Pengguna - Kavana',
  description: 'Panduan ringkas penggunaan Kavana untuk mahasiswa, dosen, koordinator, dan kaprodi.',
};

export default function PanduanPenggunaPage() {
  return (
    <ResourcePageShell
      title="Panduan Pengguna"
      subtitle="Panduan operasional agar seluruh civitas akademika dapat menjalankan proses bimbingan di Kavana secara tertib dan konsisten."
      updatedLabel="26 Februari 2026"
    >
      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">1. Mahasiswa</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-body)]">
          <li>Lengkapi profil identitas dan kontak setelah masuk ke sistem.</li>
          <li>Pilih jalur akademik (Proyek 1, Proyek 2, Proyek 3, atau Internship) sesuai kurikulum aktif.</li>
          <li>Ajukan draf proposal penelitian atau proyek, lalu pantau status validasi dari koordinator.</li>
          <li>Catat logbook konsultasi bimbingan secara berkala minimal 8 sesi resmi yang disetujui dosen.</li>
          <li>Unggah naskah laporan akhir saat syarat bimbingan terpenuhi untuk pengajuan jadwal sidang.</li>
        </ul>
      </article>

      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">2. Dosen Pembimbing</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-body)]">
          <li>Tinjau daftar mahasiswa bimbingan yang telah ditetapkan oleh koordinator.</li>
          <li>Periksa dan berikan tanggapan (persetujuan atau revisi) terhadap logbook bimbingan mahasiswa.</li>
          <li>Berikan catatan pembinaan akademik berkala agar progres mahasiswa terpantau jelas.</li>
          <li>Evaluasi kelayakan draf laporan akhir sebelum mahasiswa dijadwalkan mengikuti sidang.</li>
        </ul>
      </article>

      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">3. Koordinator dan Kaprodi</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-body)]">
          <li>Validasi kelayakan pengajuan proposal berdasarkan kelengkapan berkas dan syarat kurikulum.</li>
          <li>Distribusikan penugasan dosen pembimbing dan dewan penguji sidang sesuai keahlian bidang.</li>
          <li>Lakukan pemantauan rekapitulasi progres akademik angkatan secara berkala.</li>
          <li>Tetapkan jadwal pelaksanaan sidang, ruangan, serta tindak lanjut hasil revisi sidang.</li>
        </ul>
      </article>
    </ResourcePageShell>
  );
}
