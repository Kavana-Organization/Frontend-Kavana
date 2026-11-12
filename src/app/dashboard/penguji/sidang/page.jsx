'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  UserRound,
} from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { pengujiAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';

const HASIL_OPTIONS = [
  { value: 'lulus', label: 'Lulus (Tanpa Revisi)' },
  { value: 'lulus_revisi', label: 'Lulus dengan Revisi' },
  { value: 'tidak_lulus', label: 'Tidak Lulus' },
];

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeId(value) {
  const id = String(value ?? '').trim();
  return id || null;
}

function getProfileIds(profile) {
  return [profile?.id, profile?.dosen_id, profile?.user_id]
    .map(normalizeId)
    .filter(Boolean);
}

function isMySidang(item, profile) {
  const profileIds = getProfileIds(profile);
  const pengujiId = normalizeId(item?.penguji_id);
  if (profileIds.length > 0 && pengujiId) {
    return profileIds.includes(pengujiId);
  }

  const profileName = normalizeText(profile?.nama);
  const pengujiName = normalizeText(item?.penguji_nama || item?.nama_penguji);
  if (profileName && pengujiName) return profileName === pengujiName;

  return true;
}

function formatTanggal(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date);
}

function formatWaktu(value) {
  if (!value) return '-';
  return String(value).slice(0, 5);
}

function statusLabel(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'scheduled') return 'Terjadwal';
  if (raw === 'ongoing') return 'Berlangsung';
  if (raw === 'completed') return 'Selesai';
  return status || 'Terjadwal';
}

function getStatusKey(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'completed') return 'approved';
  if (raw === 'ongoing') return 'pending';
  return 'terjadwal';
}

function hasilLabel(value) {
  return HASIL_OPTIONS.find((option) => option.value === value)?.label || value || '-';
}

function extractDocumentLinks(item) {
  if (!item) return [];
  const links = [];
  const proposalUrl = item.file_proposal || item.proposal_url;
  const laporanUrl = item.file_laporan || item.file_url || item.laporan_url;
  if (proposalUrl) {
    links.push({ label: 'Dokumen Proposal', url: proposalUrl });
  }
  if (laporanUrl) {
    links.push({ label: 'Naskah Laporan Sidang', url: laporanUrl });
  }
  if (item.file_luaran && typeof item.file_luaran === 'string') {
    try {
      const parsed = JSON.parse(item.file_luaran);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.entries(parsed).forEach(([label, url]) => {
          if (String(url || '').trim()) {
            links.push({ label, url: String(url).trim() });
          }
        });
      } else {
        links.push({ label: 'Luaran Proyek', url: item.file_luaran });
      }
    } catch {
      links.push({ label: 'Luaran Proyek', url: item.file_luaran });
    }
  }
  return links;
}

export default function PengujiSidangPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [sidang, setSidang] = useState([]);
  const [hasilTarget, setHasilTarget] = useState(null);
  const [hasilForm, setHasilForm] = useState({ hasil_sidang: 'lulus', catatan_sidang: '' });
  const [submitting, setSubmitting] = useState(false);

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP.sidang || 'Sidang Penguji';
  }, [pathname]);

  useEffect(() => {
    if (role && role !== 'penguji') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const selectSidang = (item) => {
    setHasilTarget(item || null);
    setHasilForm({
      hasil_sidang: item?.hasil_sidang || 'lulus',
      catatan_sidang: item?.catatan_sidang || '',
    });
  };

  const loadData = async (preferredId = null) => {
    try {
      const [profileRes, sidangRes] = await Promise.all([
        pengujiAPI.getProfile(),
        pengujiAPI.getSidangList(),
      ]);
      const nextProfile = profileRes.ok ? profileRes.data : null;
      const rows = sidangRes.ok
        ? (Array.isArray(sidangRes.data) ? sidangRes.data : sidangRes.data?.data || [])
        : [];
      const mine = rows.filter((item) => isMySidang(item, nextProfile));
      setProfile(nextProfile);
      setSidang(mine);

      if (mine.length > 0) {
        const matched =
          (preferredId && mine.find((item) => item.id === preferredId)) ||
          mine.find((item) => String(item?.status || '').toLowerCase() !== 'completed') ||
          mine[0];
        selectSidang(matched);
      } else {
        selectSidang(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data sidang penguji');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = sidang.length;
    const pending = sidang.filter((item) => String(item?.status || '').toLowerCase() !== 'completed').length;
    const revisi = sidang.filter((item) => item?.hasil_sidang === 'lulus_revisi').length;
    const completed = sidang.filter((item) => String(item?.status || '').toLowerCase() === 'completed').length;
    return { total, pending, revisi, completed };
  }, [sidang]);

  const handleSubmitHasil = async (event) => {
    event.preventDefault();
    if (!hasilTarget) return;
    setSubmitting(true);
    const targetId = hasilTarget.id;
    try {
      const result = await pengujiAPI.setHasilSidang(targetId, {
        hasil_sidang: hasilForm.hasil_sidang,
        catatan_sidang: hasilForm.catatan_sidang.trim() || undefined,
      });
      if (result.ok) {
        toast.success(result.data?.message || 'Hasil sidang berhasil disimpan');
        await loadData(targetId);
      } else {
        toast.error(result.error || 'Gagal menyimpan hasil sidang');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat data sidang penguji" />;
  }

  const inputCls = 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]';
  const activeDocuments = extractDocumentLinks(hasilTarget);
  const isTargetCompleted = String(hasilTarget?.status || '').toLowerCase() === 'completed';

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Periksa jadwal dan dokumen mahasiswa pada panel kiri, lalu tetapkan hasil sidang pada panel kanan."
      />

      {/* Compact Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        {[
          ['Total sidang', stats.total, 'Semua sidang penguji'],
          ['Perlu hasil', stats.pending, 'Menunggu keputusan'],
          ['Revisi', stats.revisi, 'Ditetapkan perlu revisi'],
          ['Selesai', stats.completed, 'Hasil sudah disimpan'],
        ].map(([title, value, caption]) => (
          <div className="bg-[var(--surface-raised)] p-4 sm:p-5" key={title}>
            <p className="text-xs font-medium text-[var(--text-muted)]">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{caption}</p>
          </div>
        ))}
      </div>

      {sidang.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Belum ada jadwal sidang untuk penguji ini"
          description="Jadwal sidang yang ditugaskan oleh koordinator program studi akan tampil di sini."
        />
      ) : (
        <div
          data-testid="penguji-sidang-layout"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start"
        >
          {/* Left Pane: Schedule & Documents */}
          <div data-testid="sidang-left-pane" className="space-y-4 min-w-0">
            <Card variant="muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>Daftar Jadwal Sidang</span>
                </CardTitle>
                <CardDescription className="text-[var(--text-muted)]">
                  Pilih sesi sidang untuk melihat detail jadwal, berkas, dan mengisi penilaian.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {sidang.map((item) => {
                  const isCompleted = String(item?.status || '').toLowerCase() === 'completed';
                  const isSelected = hasilTarget?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-xl border p-3.5 transition-colors',
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                          : 'border-[var(--line)] bg-[var(--surface-raised)]'
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-semibold text-[var(--text-strong)] break-words">
                            {item.display_nama || item.mahasiswa_nama || '-'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] break-words">
                            <span className="font-mono tabular-nums">{item.display_npm || item.npm || '-'}</span>
                            {' · '}
                            {item.judul_proyek || '-'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-[var(--text-body)] font-mono tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                              {formatTanggal(item.tanggal)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5 shrink-0" />
                              {formatWaktu(item.waktu)}
                            </span>
                            <span className="inline-flex items-center gap-1 font-sans">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {item.ruangan || '-'}
                            </span>
                          </div>
                        </div>
                        <div className="flex w-full sm:w-auto sm:shrink-0 flex-wrap flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                          <StatusBadge status={getStatusKey(item.status)} label={statusLabel(item.status)} />
                          {isCompleted ? (
                            <StatusBadge status={item.hasil_sidang} label={hasilLabel(item.hasil_sidang)} />
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => selectSidang(item)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Tentukan Hasil</span>
                            </Button>
                          )}
                          {isCompleted && !isSelected ? (
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() => selectSidang(item)}
                            >
                              Lihat Detail
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {hasilTarget ? (
              <Card variant="muted" data-testid="sidang-documents-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Jadwal & Dokumen Sidang</span>
                  </CardTitle>
                  <CardDescription className="text-[var(--text-muted)] break-words">
                    {hasilTarget.display_nama || hasilTarget.mahasiswa_nama || '-'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3.5">
                    <div className="min-w-0">
                      <dt className="text-xs text-[var(--text-muted)]">Tanggal & Waktu</dt>
                      <dd className="mt-0.5 font-mono text-xs font-medium tabular-nums text-[var(--text-strong)]">
                        {formatTanggal(hasilTarget.tanggal)} · {formatWaktu(hasilTarget.waktu)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-[var(--text-muted)]">Ruangan</dt>
                      <dd className="mt-0.5 font-medium text-[var(--text-strong)] break-words">
                        {hasilTarget.ruangan || '-'}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-[var(--text-muted)]">Pembimbing</dt>
                      <dd className="mt-0.5 font-medium text-[var(--text-strong)] break-words">
                        {hasilTarget.dosen_nama || '-'}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-[var(--text-muted)]">Penguji</dt>
                      <dd className="mt-0.5 font-medium text-[var(--text-strong)] break-words">
                        {hasilTarget.penguji_nama || profile?.nama || '-'}
                      </dd>
                    </div>
                  </dl>

                  {Array.isArray(hasilTarget?.anggota_nama) && hasilTarget.anggota_nama.length > 1 ? (
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3">
                      <p className="text-xs text-[var(--text-muted)]">Anggota Kelompok</p>
                      <p className="mt-0.5 text-sm text-[var(--text-strong)] break-words">
                        {hasilTarget.anggota_nama.join(', ')}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Tautan Berkas Mahasiswa</p>
                    {activeDocuments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {activeDocuments.map((doc) => (
                          <Button key={`${doc.label}-${doc.url}`} asChild size="sm" variant="outline">
                            <a href={doc.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>{doc.label}</span>
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2.5 text-xs text-[var(--text-muted)]">
                        Tautan berkas tidak disertakan pada data jadwal sidang ini.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Right Pane: Evaluation Form */}
          <div data-testid="sidang-right-pane" className="min-w-0">
            <Card variant="muted">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                    <UserRound className="h-4 w-4 shrink-0" />
                    <span>Form Penilaian Sidang</span>
                  </CardTitle>
                  {hasilTarget ? (
                    <StatusBadge status={getStatusKey(hasilTarget.status)} label={statusLabel(hasilTarget.status)} />
                  ) : null}
                </div>
                {hasilTarget ? (
                  <CardDescription className="text-[var(--text-muted)] break-words">
                    {hasilTarget.display_nama || hasilTarget.mahasiswa_nama || '-'} ({hasilTarget.display_npm || hasilTarget.npm || '-'}) · {hasilTarget.judul_proyek || '-'}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                {!hasilTarget ? (
                  <EmptyState
                    icon={GraduationCap}
                    title="Pilih sesi sidang"
                    description="Pilih salah satu jadwal sidang di panel kiri untuk memulai penilaian."
                  />
                ) : isTargetCompleted ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 space-y-2">
                      <p className="text-xs font-medium text-[var(--text-muted)]">Keputusan Sidang Tersimpan</p>
                      <StatusBadge
                        status={hasilTarget.hasil_sidang}
                        label={hasilLabel(hasilTarget.hasil_sidang)}
                      />
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 space-y-1.5">
                      <p className="text-xs font-medium text-[var(--text-muted)]">Catatan Sidang</p>
                      <p className="text-sm text-[var(--text-body)] whitespace-pre-line break-words">
                        {hasilTarget.catatan_sidang || 'Tidak ada catatan tambahan.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitHasil} className="space-y-4">
                    <Field label="Hasil Sidang" required>
                      {(a11y) => (
                        <Select
                          name="hasil_sidang"
                          value={hasilForm.hasil_sidang}
                          onValueChange={(value) => setHasilForm({ ...hasilForm, hasil_sidang: value })}
                        >
                          <SelectTrigger
                            id={a11y.id}
                            aria-describedby={a11y['aria-describedby']}
                            className={cn(inputCls, 'w-full')}
                          >
                            <SelectValue placeholder="Pilih hasil" />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                            {HASIL_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>

                    <Field
                      label="Catatan Sidang"
                      hint="Tuliskan catatan keputusan, poin revisi, atau alasan ketidaklulusan."
                    >
                      {(a11y) => (
                        <Textarea
                          {...a11y}
                          name="catatan_sidang"
                          rows={5}
                          value={hasilForm.catatan_sidang}
                          onChange={(event) => setHasilForm({ ...hasilForm, catatan_sidang: event.target.value })}
                          placeholder="Isi catatan keputusan, poin revisi, atau alasan tidak lulus"
                          className={inputCls}
                        />
                      )}
                    </Field>

                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-muted)]">
                      {hasilForm.hasil_sidang === 'lulus_revisi'
                        ? 'Jika dipilih lulus dengan revisi, mahasiswa akan masuk ke alur revisi sidang.'
                        : 'Keputusan ini akan menyimpan hasil sidang mahasiswa.'}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-[var(--line)]">
                      <Button type="submit" disabled={submitting}>
                        <UserRound className="h-4 w-4" />
                        <span>{submitting ? 'Menyimpan...' : 'Simpan Hasil'}</span>
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
