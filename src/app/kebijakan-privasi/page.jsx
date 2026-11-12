import ResourcePageShell from '@/components/public/resource-page-shell';

export const metadata = {
  title: 'Kebijakan Privasi - Kavana',
  description: 'Kebijakan privasi penggunaan data pada platform Kavana.',
};

export default function KebijakanPrivasiPage() {
  return (
    <ResourcePageShell
      title="Kebijakan Privasi"
      subtitle="Prinsip pengelolaan, kerahasiaan, dan perlindungan data sivitas akademika pada sistem Kavana."
      updatedLabel="26 Februari 2026"
    >
      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">1. Data yang Dikumpulkan</h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Kavana menyimpan informasi identitas akademik resmi seperti nama lengkap, Nomor Pokok Mahasiswa (NPM)
          atau Nomor Induk Dosen Nasional (NIDN), alamat email institusi, rekam jejak bimbingan, naskah proposal,
          serta berkas luaran akademik yang diunggah selama proses perkuliahan berlangsung.
        </p>
      </article>

      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">2. Tujuan Penggunaan Data</h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Data yang tersimpan digunakan semata-mata untuk memfasilitasi administrasi bimbingan, validasi kelayakan proposal,
          monitoring evaluasi dosen pembimbing, penyusunan berita acara sidang, dan pengarsipan luaran akademik sesuai
          kebijakan Program Studi D4 Teknik Informatika ULBI.
        </p>
      </article>

      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">3. Keamanan dan Pembatasan Hak Akses</h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Akses terhadap data operasional dibatasi secara ketat berdasarkan peran pengguna (Role-Based Access Control).
          Data bimbingan dan proposal mahasiswa hanya dapat diakses oleh mahasiswa bersangkutan, dosen pembimbing yang ditugaskan,
          dewan penguji, koordinator, dan pimpinan program studi.
        </p>
      </article>

      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">4. Penyimpanan dan Retensi Data</h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Seluruh rekaman bimbingan dan berkas akademik disimpan dalam basis data institusi untuk kepentingan akreditasi
          dan arsip akademik universitas selama masa retensi yang ditetapkan oleh peraturan institusi.
        </p>
      </article>
    </ResourcePageShell>
  );
}
