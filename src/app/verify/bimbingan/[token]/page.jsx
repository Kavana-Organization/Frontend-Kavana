'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  GraduationCap,
  Printer,
  ArrowLeft,
  FileCheck2,
  Calendar,
  Clock,
  User,
  Hash,
  BookOpen,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { Button } from '@/components/ui/button';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL
  || 'https://asia-southeast2-renzip-478811.cloudfunctions.net/kavana'
).replace(/\/$/, '');

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

/**
 * Maps raw technical or English error strings to user-safe Bahasa Indonesia messages
 * at the render layer while preserving valid Indonesian messages from the server.
 */
export function mapVerificationError(errorString) {
  if (!errorString) {
    return 'Terjadi kendala saat memverifikasi data tanda tangan digital.';
  }
  const str = String(errorString).trim();
  const lower = str.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('network error') ||
    lower.includes('networkerror') ||
    lower.includes('econnrefused') ||
    lower.includes('offline')
  ) {
    return 'Gagal terhubung ke server verifikasi. Periksa koneksi internet Anda dan coba lagi.';
  }

  if (
    lower.includes('token not found') ||
    lower.includes('not found') ||
    lower.includes('invalid token') ||
    lower.includes('tidak ditemukan')
  ) {
    return 'Tanda tangan digital tidak ditemukan atau token verifikasi tidak valid.';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Waktu permintaan verifikasi berakhir. Silakan muat ulang halaman.';
  }

  if (lower.includes('internal server error') || lower.includes('500')) {
    return 'Terjadi kendala pada server verifikasi. Silakan coba beberapa saat lagi.';
  }

  if (lower.includes('unauthorized') || lower.includes('forbidden')) {
    return 'Akses ke data verifikasi ini tidak diizinkan.';
  }

  return str;
}

export default function VerifyBimbinganPage({ params }) {
  const [token, setToken] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [result, setResult] = React.useState({ data: null, notFound: false, error: null });

  React.useEffect(() => {
    let active = true;

    Promise.resolve(params)
      .then((p) => {
        const resolvedToken = p?.token || '';
        if (!active) return;
        setToken(resolvedToken);

        if (!resolvedToken) {
          setLoading(false);
          setResult({ notFound: true, data: null, error: null });
          return;
        }

        setLoading(true);
        fetchVerification(resolvedToken)
          .then((res) => {
            if (!active) return;
            setResult({
              data: res.data || null,
              notFound: Boolean(res.notFound),
              error: res.error || null,
            });
            setLoading(false);
          })
          .catch((err) => {
            if (!active) return;
            setResult({
              data: null,
              notFound: false,
              error: err?.message || 'Network error',
            });
            setLoading(false);
          });
      })
      .catch((err) => {
        if (!active) return;
        setResult({
          data: null,
          notFound: false,
          error: err?.message || 'Network error',
        });
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params]);

  const { data, notFound, error } = result;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-page)] px-4 py-8 sm:px-6 sm:py-12 print:bg-white print:p-0">
      <main className="mx-auto max-w-[760px] print:max-w-none print:w-full">
        {/* Navigation & Document Actions (Screen Only) */}
        <nav
          aria-label="Navigasi Halaman"
          className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-body)] transition-colors hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <GraduationCap className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            <span>KavanaHub</span>
          </Link>

          {data && !loading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-body)] hover:text-[var(--text-strong)]"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cetak Bukti</span>
            </Button>
          )}
        </nav>

        {/* Printable Document Sheet */}
        <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-6 sm:p-8 shadow-none print:rounded-none print:border-none print:bg-transparent print:p-0">
          {/* Institutional Document Header */}
          <header className="border-b border-[var(--line)] pb-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Dokumen Resmi Institusi
                </p>
                <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-normal text-[var(--text-strong)]">
                  Verifikasi Tanda Tangan Bimbingan
                </h1>
                <p className="mt-1.5 text-xs text-[var(--text-muted)] leading-relaxed">
                  Layanan pengesahan dan pembuktian keaslian tanda tangan digital pada formulir logbook bimbingan resmi KavanaHub.
                </p>
              </div>

              <div className="hidden sm:flex flex-col items-end shrink-0 text-right print:flex">
                <span className="text-xs font-semibold text-[var(--text-strong)]">
                  D4 Teknik Informatika
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Sistem Informasi Akademik
                </span>
              </div>
            </div>
          </header>

          {/* Body Content */}
          <div className="mt-6 space-y-6">
            {loading ? (
              <div className="py-8">
                <LoadingState
                  label="Memuat data verifikasi bimbingan..."
                  variant="dashboard"
                />
              </div>
            ) : notFound ? (
              <section
                aria-label="Status Verifikasi"
                className="rounded-xl border border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.08)] p-5"
              >
                <div className="flex items-start gap-3.5">
                  <ShieldAlert
                    className="h-5 w-5 shrink-0 text-[hsl(var(--ctp-red))] mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[hsl(var(--ctp-red))]">
                        Tanda Tangan Tidak Ditemukan
                      </h2>
                      <StatusBadge
                        status="rejected"
                        label="Tidak Terdaftar"
                        className="text-xs font-medium"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-body)] leading-relaxed">
                      Kode QR atau token verifikasi tidak terdaftar dalam pangkalan data sistem. Pastikan dokumen yang Anda periksa merupakan dokumen asli resmi yang diterbitkan oleh KavanaHub.
                    </p>
                    {token && (
                      <p className="text-xs text-[var(--text-muted)] pt-1">
                        Token yang diperiksa:{' '}
                        <span className="font-mono tabular-nums text-[var(--text-strong)] break-all">
                          {token}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </section>
            ) : error ? (
              <section
                aria-label="Status Verifikasi"
                className="rounded-xl border border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.08)] p-5"
              >
                <div className="flex items-start gap-3.5">
                  <ShieldAlert
                    className="h-5 w-5 shrink-0 text-[hsl(var(--ctp-red))] mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[hsl(var(--ctp-red))]">
                        Gagal Memuat Data Verifikasi
                      </h2>
                      <StatusBadge
                        status="rejected"
                        label="Kendala Sistem"
                        className="text-xs font-medium"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-body)] leading-relaxed">
                      {mapVerificationError(error)}
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <>
                {/* Status Banner */}
                <section
                  aria-label="Status Verifikasi"
                  className={
                    data?.status === 'active'
                      ? 'rounded-xl border border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.08)] p-5'
                      : 'rounded-xl border border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.08)] p-5'
                  }
                >
                  <div className="flex items-start gap-3.5">
                    {data?.status === 'active' ? (
                      <ShieldCheck
                        className="h-5 w-5 shrink-0 text-[hsl(var(--ctp-green))] mt-0.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <ShieldX
                        className="h-5 w-5 shrink-0 text-[hsl(var(--ctp-red))] mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2
                          className={
                            data?.status === 'active'
                              ? 'text-sm font-semibold text-[hsl(var(--ctp-green))]'
                              : 'text-sm font-semibold text-[hsl(var(--ctp-red))]'
                          }
                        >
                          {data?.status === 'active'
                            ? 'Tanda Tangan Sah & Terverifikasi'
                            : 'Tanda Tangan Digital Telah Dicabut'}
                        </h2>
                        <StatusBadge
                          status={data?.status === 'active' ? 'active' : 'revoked'}
                          label={data?.status === 'active' ? 'Valid' : 'Dicabut'}
                          className="text-xs font-medium"
                        />
                      </div>

                      <p className="text-xs text-[var(--text-body)] leading-relaxed">
                        {data?.status === 'active' ? (
                          <>
                            Dokumen bimbingan ini sah dan telah ditandatangani secara elektronik pada{' '}
                            <span className="font-mono tabular-nums font-medium text-[var(--text-strong)]">
                              {formatDate(data.signed_at)}
                            </span>
                            .
                          </>
                        ) : (
                          <>
                            {[
                              data.revoked_reason ? `Alasan: ${data.revoked_reason}` : null,
                              data.revoked_at
                                ? `Dicabut pada: ${formatDate(data.revoked_at)}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') ||
                              'Tanda tangan ini telah dicabut oleh dosen pembimbing dan tidak berlaku lagi sebagai bukti bimbingan.'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Definition List 1: Data Mahasiswa & Sesi Bimbingan */}
                <section
                  aria-labelledby="heading-data-mahasiswa"
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 print:border-gray-300"
                >
                  <h2
                    id="heading-data-mahasiswa"
                    className="text-sm font-semibold text-[var(--text-strong)] border-b border-[var(--line)] pb-3 flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                    <span>Data Mahasiswa & Sesi Bimbingan</span>
                  </h2>

                  <dl className="mt-3 divide-y divide-[var(--line)]">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Nama Mahasiswa
                      </dt>
                      <dd className="text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {data.mahasiswa?.nama || '-'}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        NPM
                      </dt>
                      <dd className="font-mono tabular-nums text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {data.mahasiswa?.npm || '-'}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Track / Jalur Proyek
                      </dt>
                      <dd className="text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {data.mahasiswa?.track || '-'}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Minggu ke-
                      </dt>
                      <dd className="font-mono tabular-nums text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {data.bimbingan?.minggu_ke ?? '-'}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Tanggal Sesi Bimbingan
                      </dt>
                      <dd className="font-mono tabular-nums text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {formatDate(data.bimbingan?.tanggal)}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Topik Bimbingan
                      </dt>
                      <dd className="text-sm font-medium text-[var(--text-strong)] sm:text-right max-w-md">
                        {data.bimbingan?.topik || '-'}
                      </dd>
                    </div>
                  </dl>
                </section>

                {/* Definition List 2: Metadata Verifikasi & Tanda Tangan Digital */}
                <section
                  aria-labelledby="heading-metadata-verifikasi"
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 print:border-gray-300"
                >
                  <h2
                    id="heading-metadata-verifikasi"
                    className="text-sm font-semibold text-[var(--text-strong)] border-b border-[var(--line)] pb-3 flex items-center gap-2"
                  >
                    <FileCheck2 className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                    <span>Metadata Verifikasi & Tanda Tangan Digital</span>
                  </h2>

                  <dl className="mt-3 divide-y divide-[var(--line)]">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Dosen Pembimbing
                      </dt>
                      <dd className="text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {data.dosen?.nama || '-'}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        NIDN
                      </dt>
                      <dd className="font-mono tabular-nums text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {data.dosen?.nidn || '—'}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Kode Dosen
                      </dt>
                      <dd className="font-mono tabular-nums text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {data.dosen?.kode_dosen || '—'}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        NIK Dosen
                      </dt>
                      <dd className="text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        <span className="font-mono tabular-nums">
                          {data.dosen?.nik_masked || '—'}
                        </span>
                        <span className="block text-xs font-normal text-[var(--text-muted)] mt-0.5">
                          Disamarkan untuk privasi
                        </span>
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Token Verifikasi
                      </dt>
                      <dd className="font-mono tabular-nums text-xs font-medium text-[var(--text-strong)] break-all sm:text-right">
                        {token || '-'}
                      </dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                      <dt className="text-xs font-medium text-[var(--text-muted)]">
                        Waktu Penandatanganan
                      </dt>
                      <dd className="font-mono tabular-nums text-sm font-medium text-[var(--text-strong)] sm:text-right">
                        {formatDate(data.signed_at)}
                      </dd>
                    </div>

                    {data.revoked_at ? (
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-2.5 gap-1">
                        <dt className="text-xs font-medium text-[var(--text-muted)]">
                          Waktu Pencabutan
                        </dt>
                        <dd className="font-mono tabular-nums text-sm font-medium text-[hsl(var(--ctp-red))] sm:text-right">
                          {formatDate(data.revoked_at)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
              </>
            )}
          </div>

          {/* Institutional Document Footer */}
          <footer className="mt-8 border-t border-[var(--line)] pt-4 text-center print:border-gray-300">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Verifikasi resmi diterbitkan otomatis oleh Sistem KavanaHub —{' '}
              <span className="font-mono tabular-nums">{formatDate(new Date().toISOString())}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Keabsahan dokumen ini dapat dikonfirmasi ulang melalui pemindaian kode QR resmi.
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
