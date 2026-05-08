import Link from 'next/link';
import { ShieldCheck, ShieldAlert, ShieldX, GraduationCap } from 'lucide-react';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL
  || 'https://asia-southeast2-renzip-478811.cloudfunctions.net/kavana'
).replace(/\/$/, '');

export const dynamic = 'force-dynamic';

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(d);
}

async function fetchVerification(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/verify/bimbingan/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return { notFound: true };
    if (!res.ok) return { error: 'Gagal memuat data verifikasi' };
    const data = await res.json();
    return { data };
  } catch (err) {
    return { error: err.message || 'Network error' };
  }
}

export default async function VerifyBimbinganPage({ params }) {
  const { token } = await params;
  const { data, notFound, error } = await fetchVerification(token);

  return (
    <div className="min-h-screen bg-[hsl(var(--ctp-base))] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--ctp-subtext1))] hover:text-[hsl(var(--ctp-blue))]"
        >
          <GraduationCap className="h-4 w-4" /> KavanaHub
        </Link>

        <h1 className="mt-6 text-2xl font-black tracking-tight text-[hsl(var(--ctp-text))]">
          Verifikasi Tanda Tangan Bimbingan
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--ctp-subtext0))]">
          Halaman ini menampilkan keaslian tanda tangan QR pada formulir bimbingan resmi KavanaHub.
        </p>

        {/* Banner status */}
        <div className="mt-6">
          {notFound ? (
            <StatusBanner
              tone="muted"
              icon={ShieldAlert}
              title="Tanda tangan tidak ditemukan"
              description="QR yang dipindai tidak terdaftar dalam sistem. Pastikan dokumen yang Anda pegang adalah dokumen resmi KavanaHub."
            />
          ) : error ? (
            <StatusBanner
              tone="muted"
              icon={ShieldAlert}
              title="Gagal memuat verifikasi"
              description={error}
            />
          ) : data?.status === 'active' ? (
            <StatusBanner
              tone="success"
              icon={ShieldCheck}
              title="Tanda tangan valid"
              description={`Diterbitkan ${formatDate(data.signed_at)}`}
            />
          ) : data?.status === 'revoked' ? (
            <StatusBanner
              tone="danger"
              icon={ShieldX}
              title="Tanda tangan dicabut"
              description={[
                data.revoked_reason ? `Alasan: ${data.revoked_reason}` : null,
                data.revoked_at ? `Pada: ${formatDate(data.revoked_at)}` : null,
              ].filter(Boolean).join(' · ') || 'Tanda tangan ini telah dicabut oleh dosen.'}
            />
          ) : null}
        </div>

        {data ? (
          <div className="mt-6 grid gap-4">
            <Card title="Identitas Dosen Pembimbing">
              <DataRow label="Nama" value={data.dosen?.nama || '-'} />
              <DataRow label="Kode Dosen" value={data.dosen?.kode_dosen || '—'} />
              <DataRow label="NIDN" value={data.dosen?.nidn || '—'} />
              <DataRow label="NIK" value={data.dosen?.nik_masked || '—'} hint="Disembunyikan untuk keamanan" />
            </Card>

            <Card title="Sesi Bimbingan">
              <DataRow label="Mahasiswa" value={data.mahasiswa?.nama || '-'} />
              <DataRow label="NPM" value={data.mahasiswa?.npm || '-'} />
              <DataRow label="Track" value={data.mahasiswa?.track || '-'} />
              <DataRow label="Tanggal Sesi" value={formatDate(data.bimbingan?.tanggal)} />
              <DataRow label="Minggu ke-" value={data.bimbingan?.minggu_ke || '-'} />
              <DataRow label="Topik" value={data.bimbingan?.topik || '-'} />
            </Card>

            <p className="text-center text-xs text-[hsl(var(--ctp-overlay1))]">
              Verifikasi otomatis oleh Sistem Kavana — {formatDate(new Date().toISOString())}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusBanner({ tone, icon: Icon, title, description }) {
  const palette = {
    success: { bg: 'ctp-green', text: 'ctp-green' },
    danger: { bg: 'ctp-red', text: 'ctp-red' },
    muted: { bg: 'ctp-overlay1', text: 'ctp-overlay1' },
  }[tone] || { bg: 'ctp-overlay1', text: 'ctp-overlay1' };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 bg-[hsl(var(--${palette.bg})/0.10)] border-[hsl(var(--${palette.bg})/0.40)]`}
    >
      <Icon className={`h-5 w-5 mt-0.5 text-[hsl(var(--${palette.text}))]`} />
      <div>
        <p className={`text-sm font-bold text-[hsl(var(--${palette.text}))]`}>{title}</p>
        {description ? (
          <p className="text-xs text-[hsl(var(--ctp-subtext1))] mt-0.5">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.84)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ctp-subtext0))] mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function DataRow({ label, value, hint }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[hsl(var(--ctp-surface1)/0.5)] py-1.5 last:border-b-0">
      <span className="text-xs text-[hsl(var(--ctp-subtext0))]">{label}</span>
      <span className="text-sm font-medium text-[hsl(var(--ctp-text))] text-right">
        {value}
        {hint ? (
          <span className="block text-[10px] font-normal text-[hsl(var(--ctp-overlay1))] mt-0.5">{hint}</span>
        ) : null}
      </span>
    </div>
  );
}
