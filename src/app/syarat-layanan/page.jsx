import ResourcePageShell from '@/components/public/resource-page-shell';

export const metadata = {
  title: 'Syarat Layanan - Kavana',
  description: 'Ketentuan penggunaan platform Kavana untuk seluruh pengguna.',
};

export default function SyaratLayananPage() {
  return (
    <ResourcePageShell
      title="Syarat Layanan"
      subtitle="Ketentuan dan tata tertib penggunaan platform Kavana bagi mahasiswa, dosen, dan pengelola akademik."
      updatedLabel="26 Februari 2026"
    >
      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">1. Kepatuhan Akun dan Kredensial</h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Pengguna wajib menggunakan identitas akademik resmi yang terdaftar pada sistem universitas. Setiap pengguna bertanggung jawab penuh
          atas keamanan kata sandi dan seluruh aktivitas yang dilakukan melalui akun masing-masing.
        </p>
      </article>

      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">2. Keaslian dan Integritas Karya</h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Seluruh proposal, catatan sesi bimbingan, naskah laporan, dan kode sumber proyek yang diunggah wajib merupakan karya asli
          yang menjunjung tinggi integritas akademik dan bebas dari plagiasi.
        </p>
      </article>

      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">3. Tata Kelola Sesi Bimbingan</h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Pencatatan sesi bimbingan harus mencerminkan interaksi nyata antara mahasiswa dan dosen pembimbing. Pembimbing berhak menolak
          atau meminta perbaikan terhadap logbook bimbingan yang tidak memenuhi standar kualitas yang ditetapkan.
        </p>
      </article>

      <article className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-strong)]">4. Ketentuan Perubahan dan Pembaruan Sistem</h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Pengelola Program Studi D4 Teknik Informatika ULBI berhak memperbarui alur proses, instrumen penilaian, dan fitur sistem
          sewaktu-waktu sesuai dengan penyesuaian kurikulum dan regulasi akademik universitas.
        </p>
      </article>
    </ResourcePageShell>
  );
}
