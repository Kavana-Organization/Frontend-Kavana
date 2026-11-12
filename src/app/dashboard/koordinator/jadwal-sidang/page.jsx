'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  UserRound,
  Users,
} from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { DashboardDialog } from '@/components/shared/dashboard-dialog';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';

const INITIAL_FORM = { mahasiswa_id: '', penguji_id: '', tanggal: '', waktu: '', ruangan: '' };

const HASIL_OPTIONS = [
  { value: 'lulus', label: 'Lulus (Tanpa Revisi)' },
  { value: 'lulus_revisi', label: 'Lulus dengan Revisi' },
  { value: 'tidak_lulus', label: 'Tidak Lulus' },
];

function buildGroupOptionValue(memberIds) {
  const ids = (Array.isArray(memberIds) ? memberIds : [])
    .map((id) => String(id))
    .filter(Boolean)
    .join(',');
  return `group:${ids}`;
}

function buildMahasiswaOptionValue(id) {
  return `mhs:${id}`;
}

function normalizeId(value) {
  const id = String(value ?? '').trim();
  return id || null;
}

function parseSelectedMahasiswaIds(value) {
  if (!value) return [];

  if (value.startsWith('group:')) {
    return value
      .slice('group:'.length)
      .split(',')
      .map(normalizeId)
      .filter(Boolean);
  }

  if (value.startsWith('mhs:')) {
    const id = normalizeId(value.slice('mhs:'.length));
    return id ? [id] : [];
  }

  const fallbackId = normalizeId(value);
  return fallbackId ? [fallbackId] : [];
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

function isProyekTrack(track) {
  return String(track || '').toLowerCase().includes('proyek');
}

function normalizeWaktu(value) {
  if (!value) return '';
  const str = String(value);
  return str.length >= 5 ? str.slice(0, 5) : str;
}

const ACTIVE_STATUSES = new Set(['scheduled', 'ongoing']);

export default function JadwalSidangPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [jadwal, setJadwal] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [mahasiswa, setMahasiswa] = useState([]);
  const [penguji, setPenguji] = useState([]);
  const [hasilTarget, setHasilTarget] = useState(null);
  const [hasilForm, setHasilForm] = useState({ hasil_sidang: 'lulus', catatan_sidang: '' });
  const [submittingHasil, setSubmittingHasil] = useState(false);

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['jadwal-sidang'] || 'Jadwal Sidang';
  }, [pathname]);

  useEffect(() => {
    if (role && !['koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const [sidangRes, mahasiswaRes, pengujiRes] = await Promise.all([
        koordinatorAPI.getAllSidang(),
        koordinatorAPI.getMahasiswaList(),
        koordinatorAPI.getPengujiList(),
      ]);

      if (sidangRes.ok) setJadwal(Array.isArray(sidangRes.data) ? sidangRes.data : []);
      if (mahasiswaRes.ok) setMahasiswa(Array.isArray(mahasiswaRes.data) ? mahasiswaRes.data : []);
      if (pengujiRes.ok) setPenguji(Array.isArray(pengujiRes.data) ? pengujiRes.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data sidang');
    } finally {
      setLoading(false);
    }
  };

  const scheduledIds = useMemo(() => {
    return new Set(jadwal.map((item) => String(item?.mahasiswa_id ?? '')).filter(Boolean));
  }, [jadwal]);

  const mahasiswaOptions = useMemo(() => {
    const raw = Array.isArray(mahasiswa) ? mahasiswa : [];
    const result = [];

    raw.forEach((entry) => {
      const canBeScheduled = entry?.status_proposal === 'approved' && !!entry?.dosen_id;
      if (!canBeScheduled) return;

      const isProyek = String(entry?.track || '').includes('proyek');
      const members = Array.isArray(entry?.anggota) && entry.anggota.length > 0
        ? entry.anggota
        : [{ id: entry.id, nama: entry.nama, npm: entry.npm }];

      const availableMembers = members.filter((member) => (
        member?.id && !scheduledIds.has(String(member.id))
      ));

      if (availableMembers.length === 0) return;

      const isEligible = entry?.sidang_eligible === true;
      const reason = entry?.sidang_ineligible_reason || null;

      if (isProyek && entry?.kelompok_id) {
        const memberIds = availableMembers.map((member) => member.id);
        const groupName = entry.kelompok_nama || `Kelompok ${entry.kelompok_id}`;

        result.push({
          value: buildGroupOptionValue(memberIds),
          label: groupName,
          sortLabel: groupName,
          disabled: !isEligible,
          reason: !isEligible ? reason : null,
        });
        return;
      }

      availableMembers.forEach((member) => {
        result.push({
          value: buildMahasiswaOptionValue(member.id),
          label: member.nama || entry.nama || '-',
          sortLabel: member.nama || entry.nama || '-',
          disabled: !isEligible,
          reason: !isEligible ? reason : null,
        });
      });
    });

    const unique = new Map();
    result.forEach((item) => {
      const existing = unique.get(item.value);
      if (!existing || (existing.disabled && !item.disabled)) {
        unique.set(item.value, item);
      }
    });

    return Array.from(unique.values()).sort((a, b) => {
      if (a.disabled !== b.disabled) return a.disabled ? 1 : -1;
      return a.sortLabel.localeCompare(b.sortLabel);
    });
  }, [mahasiswa, scheduledIds]);

  const eligibleOptions = useMemo(
    () => mahasiswaOptions.filter((item) => !item.disabled),
    [mahasiswaOptions]
  );
  const ineligibleOptions = useMemo(
    () => mahasiswaOptions.filter((item) => item.disabled),
    [mahasiswaOptions]
  );
  const hasRemainingCandidate = eligibleOptions.length > 0;

  const selectedDosenId = useMemo(() => {
    const ids = parseSelectedMahasiswaIds(form.mahasiswa_id);
    if (ids.length === 0) return null;
    const raw = Array.isArray(mahasiswa) ? mahasiswa : [];
    for (const entry of raw) {
      const members = Array.isArray(entry?.anggota) && entry.anggota.length > 0
        ? entry.anggota
        : [{ id: entry.id }];
      if (members.some((m) => ids.includes(normalizeId(m?.id)))) {
        return normalizeId(entry?.dosen_id);
      }
    }
    return null;
  }, [form.mahasiswa_id, mahasiswa]);

  const conflictWarning = useMemo(() => {
    const pengujiId = normalizeId(form.penguji_id);
    const tanggal = form.tanggal;
    const waktu = normalizeWaktu(form.waktu);

    if (selectedDosenId && pengujiId && selectedDosenId === pengujiId) {
      return 'Dosen pembimbing dan penguji tidak boleh orang yang sama.';
    }
    if (!tanggal || !waktu) return null;

    const slotJadwal = (Array.isArray(jadwal) ? jadwal : []).filter((j) => {
      if (!ACTIVE_STATUSES.has(String(j?.status || '').toLowerCase())) return false;
      return String(j?.tanggal || '').slice(0, 10) === tanggal
        && normalizeWaktu(j?.waktu) === waktu;
    });

    if (selectedDosenId) {
      const conflict = slotJadwal.find((j) => (
        normalizeId(j?.dosen_id) === selectedDosenId || normalizeId(j?.penguji_id) === selectedDosenId
      ));
      if (conflict) {
        return `Dosen pembimbing (${conflict.dosen_nama || conflict.penguji_nama || 'dosen'}) sudah dijadwalkan pada slot ini.`;
      }
    }

    if (pengujiId) {
      const conflict = slotJadwal.find((j) => (
        normalizeId(j?.dosen_id) === pengujiId || normalizeId(j?.penguji_id) === pengujiId
      ));
      if (conflict) {
        return `Penguji yang dipilih sudah dijadwalkan sebagai ${normalizeId(conflict.dosen_id) === pengujiId ? 'pembimbing' : 'penguji'} pada slot ini.`;
      }
    }

    return null;
  }, [form.penguji_id, form.tanggal, form.waktu, selectedDosenId, jadwal]);

  const groupedJadwal = useMemo(() => {
    const raw = Array.isArray(jadwal) ? jadwal : [];
    const result = [];
    const kelompokMap = new Map();

    raw.forEach((entry) => {
      const proyekKelompok = isProyekTrack(entry?.track) && entry?.kelompok_id;

      if (!proyekKelompok) {
        result.push({
          ...entry,
          display_nama: entry?.mahasiswa_nama || entry?.nama || '-',
          display_npm: entry?.npm || '-',
          anggota_nama: [entry?.mahasiswa_nama || entry?.nama].filter(Boolean),
        });
        return;
      }

      const key = [
        entry.kelompok_id,
        entry.tanggal,
        entry.waktu,
        entry.ruangan,
        entry.dosen_id,
        entry.penguji_id,
      ].join(':');

      if (!kelompokMap.has(key)) {
        kelompokMap.set(key, {
          ...entry,
          anggota_nama: [],
          anggota_npm: [],
        });
      }

      const grouped = kelompokMap.get(key);
      if (entry?.mahasiswa_nama && !grouped.anggota_nama.includes(entry.mahasiswa_nama)) {
        grouped.anggota_nama.push(entry.mahasiswa_nama);
      }
      if (entry?.npm && !grouped.anggota_npm.includes(entry.npm)) {
        grouped.anggota_npm.push(entry.npm);
      }
    });

    kelompokMap.forEach((entry) => {
      result.push({
        ...entry,
        display_nama:
          entry.kelompok_nama ||
          `Kelompok ${entry.anggota_nama.join(' & ')}`,
        display_npm: entry.anggota_npm.join(', '),
      });
    });

    return result;
  }, [jadwal]);

  const handleSchedule = async (e) => {
    e.preventDefault();

    if (!form.mahasiswa_id || !form.penguji_id || !form.tanggal || !form.waktu || !form.ruangan.trim()) {
      toast.error('Lengkapi semua field wajib');
      return;
    }

    const targetMahasiswaIds = parseSelectedMahasiswaIds(form.mahasiswa_id);
    if (targetMahasiswaIds.length === 0) {
      toast.error('Target mahasiswa tidak valid');
      return;
    }

    const payloadBase = {
      penguji_id: form.penguji_id,
      tanggal: form.tanggal,
      waktu: form.waktu.length === 5 ? `${form.waktu}:00` : form.waktu,
      ruangan: form.ruangan.trim(),
    };

    try {
      let successCount = 0;
      let failedCount = 0;
      let firstError = '';

      for (const mahasiswaId of targetMahasiswaIds) {
        const res = await koordinatorAPI.scheduleSidang({
          ...payloadBase,
          mahasiswa_id: mahasiswaId,
        });

        if (res.ok) {
          successCount += 1;
        } else {
          failedCount += 1;
          if (!firstError) firstError = res.error || '';
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount > 1
            ? `Jadwal sidang berhasil dibuat untuk ${successCount} mahasiswa`
            : 'Jadwal sidang berhasil dibuat'
        );
        loadData();
      }

      if (failedCount > 0) {
        toast.error(firstError || `Gagal menjadwalkan ${failedCount} mahasiswa`);
      }

      if (failedCount === 0) {
        setShowModal(false);
        setForm(INITIAL_FORM);
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  const openHasil = (item) => {
    setHasilTarget(item);
    setHasilForm({
      hasil_sidang: item?.hasil_sidang || 'lulus',
      catatan_sidang: item?.catatan_sidang || '',
    });
  };

  const handleSubmitHasil = async (e) => {
    e.preventDefault();
    if (!hasilTarget) return;
    setSubmittingHasil(true);
    try {
      const res = await koordinatorAPI.setHasilSidang(hasilTarget.id, {
        hasil_sidang: hasilForm.hasil_sidang,
        catatan_sidang: hasilForm.catatan_sidang.trim() || undefined,
      });
      if (res.ok) {
        toast.success(res.data?.message || 'Hasil sidang berhasil disimpan');
        setHasilTarget(null);
        loadData();
      } else {
        toast.error(res.error || 'Gagal menyimpan hasil sidang');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSubmittingHasil(false);
    }
  };

  if (loading) {
    return <LoadingState variant="table" label="Memuat jadwal sidang" />;
  }

  const inputCls = 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]';

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Atur jadwal presentasi sidang, ruang, penguji utama, dan tetapkan hasil sidang."
      >
        <Button
          type="button"
          onClick={() => {
            setShowModal(true);
            setForm(INITIAL_FORM);
          }}
          disabled={!hasRemainingCandidate}
        >
          <Plus className="h-4 w-4" />
          <span>Jadwalkan</span>
        </Button>
      </PageHeader>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <span>Daftar Jadwal Sidang</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Menampilkan seluruh sesi sidang terjadwal dan status penyelesaiannya.
            </CardDescription>
          </div>
          <span className="w-fit rounded-md border border-[var(--line)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-mono font-medium tabular-nums text-[var(--text-body)]">
            {groupedJadwal.length} sesi
          </span>
        </CardHeader>
        <CardContent>
          {groupedJadwal.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Belum ada jadwal sidang"
              description="Gunakan tombol Jadwalkan untuk menentukan tanggal, ruang, dan penguji mahasiswa yang layak sidang."
            />
          ) : (
            <div className="space-y-3">
              {groupedJadwal.map((j, i) => (
                <div
                  key={`${j.kelompok_id || 'mhs'}:${j.id || i}:${j.tanggal || ''}:${j.waktu || ''}`}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-sm font-semibold text-[var(--text-strong)] break-words">
                        {j.display_nama || '-'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] break-words">
                        <span className="font-mono tabular-nums">{j.display_npm || '-'}</span>
                        {' · '}
                        {j.judul_proyek || '-'}
                      </p>
                      {isProyekTrack(j?.track) && Array.isArray(j?.anggota_nama) && j.anggota_nama.length > 1 ? (
                        <p className="text-xs text-[var(--text-body)] break-words">
                          Anggota: {j.anggota_nama.join(', ')}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-[var(--text-body)] font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                          {formatTanggal(j.tanggal)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                          {formatWaktu(j.waktu)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-sans">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                          {j.ruangan || '-'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[var(--text-muted)]">
                        <span className="rounded-md border border-[var(--line)] bg-[var(--surface-sunken)] px-2 py-0.5 text-[var(--text-body)] break-words">
                          Pembimbing: {j.dosen_nama || '-'}
                        </span>
                        <span className="rounded-md border border-[var(--line)] bg-[var(--surface-sunken)] px-2 py-0.5 text-[var(--text-body)] break-words">
                          Penguji: {j.penguji_nama || '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end shrink-0">
                      <StatusBadge status={getStatusKey(j.status)} label={statusLabel(j.status)} />
                      {String(j.status || '').toLowerCase() !== 'completed' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openHasil(j)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Selesaikan</span>
                        </Button>
                      ) : j.hasil_sidang ? (
                        <StatusBadge
                          status={j.hasil_sidang}
                          label={HASIL_OPTIONS.find((o) => o.value === j.hasil_sidang)?.label || j.hasil_sidang}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardDialog
        open={showModal}
        onOpenChange={setShowModal}
        title="Jadwalkan Sidang"
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <h3 className="mb-4 text-lg font-semibold text-[var(--text-strong)]">Jadwalkan Sidang</h3>
        <form data-testid="jadwal-sidang-form" onSubmit={handleSchedule} className="space-y-4">
          <fieldset className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3.5">
            <legend className="px-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Sidang
            </legend>
            <Field label="Mahasiswa / Kelompok" required>
              {(a11y) => (
                <Select
                  name="mahasiswa_id"
                  value={form.mahasiswa_id}
                  onValueChange={(value) => setForm({ ...form, mahasiswa_id: value })}
                >
                  <SelectTrigger
                    id={a11y.id}
                    aria-describedby={a11y['aria-describedby']}
                    className={cn(inputCls, 'w-full')}
                  >
                    <SelectValue placeholder="Pilih kelompok (proyek) / mahasiswa (internship)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                    {eligibleOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                    {ineligibleOptions.length > 0 ? (
                      <div className="px-2 py-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                        Belum layak sidang
                      </div>
                    ) : null}
                    {ineligibleOptions.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        disabled
                        className="opacity-60"
                      >
                        <span className="flex flex-col">
                          <span>{item.label}</span>
                          {item.reason ? (
                            <span className="text-xs text-[hsl(var(--ctp-peach))]">
                              {item.reason}
                            </span>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </fieldset>

          <fieldset className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3.5">
            <legend className="px-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Ruang dan Waktu
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Tanggal" required>
                {(a11y) => (
                  <Input
                    {...a11y}
                    name="tanggal"
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className={inputCls}
                  />
                )}
              </Field>
              <Field label="Waktu" required>
                {(a11y) => (
                  <Input
                    {...a11y}
                    name="waktu"
                    type="time"
                    value={form.waktu}
                    onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                    className={inputCls}
                  />
                )}
              </Field>
            </div>
            <Field label="Ruangan" required>
              {(a11y) => (
                <Input
                  {...a11y}
                  name="ruangan"
                  value={form.ruangan}
                  onChange={(e) => setForm({ ...form, ruangan: e.target.value })}
                  placeholder="Contoh: Lab Informatika 301"
                  className={inputCls}
                />
              )}
            </Field>
          </fieldset>

          <fieldset className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3.5">
            <legend className="px-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Penguji
            </legend>
            <Field label="Penguji Utama" required>
              {(a11y) => (
                <Select
                  name="penguji_id"
                  value={form.penguji_id}
                  onValueChange={(value) => setForm({ ...form, penguji_id: value })}
                >
                  <SelectTrigger
                    id={a11y.id}
                    aria-describedby={a11y['aria-describedby']}
                    className={cn(inputCls, 'w-full')}
                  >
                    <SelectValue placeholder="Pilih penguji" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                    {penguji.map((dosen) => (
                      <SelectItem key={dosen.id} value={String(dosen.id)}>
                        {dosen.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </fieldset>

          <fieldset className="space-y-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3.5">
            <legend className="px-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Catatan
            </legend>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Syarat kelayakan: bimbingan minimal 8 sesi disetujui dan laporan sidang disetujui. Penguji utama tidak boleh sama dengan dosen pembimbing atau bentrok pada tanggal dan waktu yang sama.
            </p>
            {!hasRemainingCandidate ? (
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-muted)] flex items-start gap-2">
                <Users className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {ineligibleOptions.length > 0
                    ? 'Belum ada mahasiswa/kelompok yang layak sidang. Pastikan bimbingan ≥ 8 dan laporan sidang sudah disetujui.'
                    : 'Semua mahasiswa eligible sudah memiliki jadwal sidang.'}
                </span>
              </div>
            ) : null}
            {conflictWarning ? (
              <div
                role="alert"
                className="rounded-lg border border-[hsl(var(--ctp-peach)/0.45)] bg-[hsl(var(--ctp-peach)/0.10)] px-3 py-2 text-xs text-[hsl(var(--ctp-peach))] flex items-start gap-2"
              >
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{conflictWarning}</span>
              </div>
            ) : null}
          </fieldset>

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit">
              <UserRound className="h-4 w-4" />
              <span>Jadwalkan</span>
            </Button>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        open={!!hasilTarget}
        onOpenChange={(open) => {
          if (!open) setHasilTarget(null);
        }}
        title="Selesaikan Sidang"
        className="max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h3 className="mb-3 text-lg font-semibold text-[var(--text-strong)]">Tandai Hasil Sidang</h3>
        {hasilTarget ? (
          <form onSubmit={handleSubmitHasil} className="space-y-4">
            <p className="text-sm text-[var(--text-body)] break-words">
              {hasilTarget.display_nama || hasilTarget.mahasiswa_nama || '-'} ·{' '}
              <span className="font-mono text-xs tabular-nums">
                {formatTanggal(hasilTarget.tanggal)} {formatWaktu(hasilTarget.waktu)}
              </span>
            </p>
            <Field label="Hasil Sidang" required>
              {(a11y) => (
                <Select
                  name="hasil_sidang"
                  value={hasilForm.hasil_sidang}
                  onValueChange={(v) => setHasilForm({ ...hasilForm, hasil_sidang: v })}
                >
                  <SelectTrigger
                    id={a11y.id}
                    aria-describedby={a11y['aria-describedby']}
                    className={cn(inputCls, 'w-full')}
                  >
                    <SelectValue placeholder="Pilih hasil" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                    {HASIL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
            <Field label="Catatan Sidang (Opsional)">
              {(a11y) => (
                <Textarea
                  {...a11y}
                  name="catatan_sidang"
                  rows={3}
                  value={hasilForm.catatan_sidang}
                  onChange={(e) => setHasilForm({ ...hasilForm, catatan_sidang: e.target.value })}
                  placeholder="Catatan untuk mahasiswa, mis. poin revisi"
                  className={inputCls}
                />
              )}
            </Field>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-muted)]">
              {hasilForm.hasil_sidang === 'lulus_revisi'
                ? 'Mahasiswa akan menerima email dan menu revisi sidang akan terbuka.'
                : 'Hasil ini akan langsung men-set sidang ke status completed.'}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <Button type="button" variant="outline" onClick={() => setHasilTarget(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={submittingHasil}>
                {submittingHasil ? 'Menyimpan...' : 'Simpan Hasil'}
              </Button>
            </div>
          </form>
        ) : null}
      </DashboardDialog>
    </div>
  );
}
