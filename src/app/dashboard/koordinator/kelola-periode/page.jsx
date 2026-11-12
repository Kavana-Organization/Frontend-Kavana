'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, Pencil, Plus } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

const TIPE_OPTIONS = [
  { value: 'proyek', label: 'Proyek' },
  { value: 'internship', label: 'Internship' },
];
const JALUR_SCOPE_OPTIONS = [
  { value: 'regular', label: 'Regular saja' },
  { value: 'rpl', label: 'RPL saja' },
  { value: 'both', label: 'Regular & RPL' },
];
const SEMESTER_TIPE_MAP = {
  2: 'proyek',
  3: 'proyek',
  5: 'proyek',
  7: 'internship',
  8: 'internship',
};
const EMPTY_FORM = {
  id: null,
  nama: '',
  tipe: 'proyek',
  semester: '',
  jalur_scope: 'both',
  start_date: '',
  end_date: '',
  deskripsi: '',
};

function getTipeBySemester(semester) {
  const normalizedSemester = Number(semester);
  return [7, 8].includes(normalizedSemester) ? 'internship' : 'proyek';
}

function getDateOnly(value) {
  return typeof value === 'string' ? value.slice(0, 10) : '';
}

function normalizePeriode(item) {
  return {
    id: item.id,
    nama: item.nama || item.nama_periode || '-',
    tipe: String(item.tipe || 'proyek').toLowerCase(),
    semester: item.semester ?? '',
    jalur_scope: item.jalur_scope || 'both',
    start_date: getDateOnly(item.start_date || item.tanggal_mulai || ''),
    end_date: getDateOnly(item.end_date || item.tanggal_selesai || ''),
    status: item.status || (item.is_active ? 'active' : 'completed'),
    deskripsi: item.deskripsi || '',
  };
}

function isPeriodeActive(periode) {
  return String(periode.status || '').toLowerCase() === 'active';
}

function getTipeLabel(tipe) {
  return tipe === 'internship' ? 'Internship' : 'Proyek';
}

function getJalurScopeLabel(jalurScope) {
  if (jalurScope === 'regular') return 'Regular';
  if (jalurScope === 'rpl') return 'RPL';
  return 'Regular & RPL';
}

export default function KelolaPeriodePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [periodes, setPeriodes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [mySemesters, setMySemesters] = useState([]);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [targetPeriode, setTargetPeriode] = useState(null);

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['kelola-periode'] || 'Kelola Periode';
  }, [pathname]);

  const isEditMode = form.id !== null;
  const assignedSemesterOptions = mySemesters
    .map((value) => Number(value))
    .filter((value, index, array) => Number.isInteger(value) && array.indexOf(value) === index)
    .sort((a, b) => a - b);
  const selectedSemester = form.semester ? Number(form.semester) : null;
  const selectedTipe = selectedSemester ? (SEMESTER_TIPE_MAP[selectedSemester] || getTipeBySemester(selectedSemester)) : form.tipe;
  const hasAssignments = assignedSemesterOptions.length > 0;

  useEffect(() => {
    if (role && !['koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const [periodeRes, semesterRes] = await Promise.all([
        koordinatorAPI.getJadwalList(),
        koordinatorAPI.getMySemester(),
      ]);

      if (periodeRes.ok) {
        const rows = Array.isArray(periodeRes.data) ? periodeRes.data : [];
        setPeriodes(rows.map(normalizePeriode));
      } else {
        toast.error(periodeRes.error || 'Gagal memuat data periode');
      }

      if (semesterRes.ok && semesterRes.data?.assigned) {
        const semesters = Array.isArray(semesterRes.data.semesters)
          ? semesterRes.data.semesters
          : Array.isArray(semesterRes.data.assigned_semesters)
            ? semesterRes.data.assigned_semesters
            : [semesterRes.data.semester ?? semesterRes.data.assigned_semester].filter(Boolean);
        setMySemesters(
          semesters
            .map((value) => Number(value))
            .filter((value, index, array) => Number.isInteger(value) && array.indexOf(value) === index)
            .sort((a, b) => a - b)
        );
      } else {
        setMySemesters([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan jaringan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    if (!hasAssignments) {
      toast.error('Track/semester koordinator belum di-assign. Hubungi Kaprodi.');
      return;
    }
    const defaultSemester = assignedSemesterOptions[0];
    setForm({
      ...EMPTY_FORM,
      semester: String(defaultSemester),
      tipe: getTipeBySemester(defaultSemester),
      jalur_scope: 'both',
    });
    setShowModal(true);
  };

  const openEditModal = (periode) => {
    setForm({
      id: periode.id,
      nama: periode.nama,
      tipe: periode.tipe || getTipeBySemester(periode.semester),
      semester: periode.semester ? String(periode.semester) : '',
      jalur_scope: periode.jalur_scope || 'both',
      start_date: getDateOnly(periode.start_date),
      end_date: getDateOnly(periode.end_date),
      deskripsi: periode.deskripsi || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = (open) => {
    setShowModal(open);
    if (!open) {
      setForm(EMPTY_FORM);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.start_date || !form.end_date) {
      toast.error('Nama, tipe, tanggal mulai, dan tanggal selesai wajib diisi');
      return;
    }
    if (!form.semester) {
      toast.error('Semester wajib dipilih');
      return;
    }
    if (!assignedSemesterOptions.includes(Number(form.semester))) {
      toast.error('Semester harus sesuai assignment koordinator');
      return;
    }

    const resolvedSemester = Number(form.semester);
    const resolvedTipe = SEMESTER_TIPE_MAP[resolvedSemester] || getTipeBySemester(resolvedSemester);

    const payload = {
      nama: form.nama.trim(),
      tipe: resolvedTipe,
      jalur_scope: form.jalur_scope || 'both',
      start_date: form.start_date,
      end_date: form.end_date,
      deskripsi: form.deskripsi.trim() || null,
    };

    try {
      setSubmitting(true);

      if (isEditMode) {
        const res = await koordinatorAPI.updateJadwal(form.id, payload);
        if (!res.ok) {
          toast.error(res.error || 'Gagal memperbarui periode');
          return;
        }
        toast.success('Periode berhasil diperbarui');
      } else {
        const res = await koordinatorAPI.createJadwal({
          ...payload,
          semester: resolvedSemester,
        });
        if (!res.ok) {
          toast.error(res.error || 'Gagal membuat periode');
          return;
        }
        toast.success('Periode berhasil dibuat');
      }

      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!targetPeriode) return;
    try {
      setCompletingId(targetPeriode.id);
      const res = await koordinatorAPI.completeJadwal(targetPeriode.id);
      if (!res.ok) {
        toast.error(res.error || 'Gagal mengakhiri periode');
        return;
      }
      toast.success('Periode berhasil diakhiri');
      setConfirmCompleteOpen(false);
      setTargetPeriode(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan jaringan');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return <LoadingState variant="table" label="Memuat data periode" />;
  }

  const inputCls = 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]';
  const selectCls = `${inputCls} h-10 [@media(pointer:coarse)]:min-h-11 w-full rounded-lg border px-3 text-sm disabled:opacity-60`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Kelola jadwal pembukaan periode proyek dan internship sesuai semester yang ditugaskan."
      >
        <Button type="button" onClick={openCreateModal} disabled={!hasAssignments}>
          <Plus className="h-4 w-4" />
          <span>Buat Periode</span>
        </Button>
      </PageHeader>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>Daftar Periode Akademik</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Periode aktif menentukan semester dan jalur yang dapat diikuti mahasiswa.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasAssignments ? (
              assignedSemesterOptions.map((semester) => (
                <Badge key={`assignment-${semester}`} variant="outline">
                  Semester {semester} · {getTipeLabel(getTipeBySemester(semester))}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">Belum ada assignment dari kaprodi</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {periodes.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Belum ada periode"
              description="Buat periode baru untuk membuka pendaftaran track dan pengajuan proposal mahasiswa."
              action={
                hasAssignments ? (
                  <Button type="button" size="sm" onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    <span>Buat Periode</span>
                  </Button>
                ) : null
              }
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Periode</TableHead>
                  <TableHead className="w-[110px]">Tipe</TableHead>
                  <TableHead className="w-[120px]">Semester</TableHead>
                  <TableHead className="w-[140px]">Jalur</TableHead>
                  <TableHead className="w-[190px]">Rentang Tanggal</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[190px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodes.map((periode) => {
                  const active = isPeriodeActive(periode);
                  return (
                    <TableRow key={periode.id}>
                      <TableCell data-label="Nama Periode" className="whitespace-normal break-words">
                        <div className="font-medium text-[var(--text-strong)]">{periode.nama}</div>
                        {periode.deskripsi ? (
                          <p className="mt-0.5 text-xs text-[var(--text-muted)] break-words">
                            {periode.deskripsi}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell data-label="Tipe" className="text-sm text-[var(--text-body)]">
                        {getTipeLabel(periode.tipe)}
                      </TableCell>
                      <TableCell data-label="Semester" className="font-mono text-xs tabular-nums text-[var(--text-body)]">
                        {periode.semester ? `Semester ${periode.semester}` : '-'}
                      </TableCell>
                      <TableCell data-label="Jalur" className="text-sm text-[var(--text-body)]">
                        {getJalurScopeLabel(periode.jalur_scope)}
                      </TableCell>
                      <TableCell data-label="Rentang Tanggal" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {periode.start_date || '-'} — {periode.end_date || '-'}
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge
                          status={active ? 'active' : 'completed'}
                          label={active ? 'Aktif' : 'Selesai'}
                        />
                      </TableCell>
                      <TableCell data-label="Aksi">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(periode)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Button>
                          {active ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={completingId === periode.id}
                              onClick={() => {
                                setTargetPeriode(periode);
                                setConfirmCompleteOpen(true);
                              }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{completingId === periode.id ? 'Memproses...' : 'Akhiri'}</span>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DashboardDialog
        open={showModal}
        onOpenChange={handleCloseModal}
        title={isEditMode ? 'Edit Periode' : 'Buat Periode Baru'}
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <h3 className="mb-4 text-lg font-semibold text-[var(--text-strong)]">
          {isEditMode ? 'Edit Periode' : 'Buat Periode Baru'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field label="Nama Periode" required>
            {(a11y) => (
              <Input
                {...a11y}
                name="nama"
                value={form.nama}
                onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                placeholder="Contoh: Proyek 1 Angkatan 24"
                className={inputCls}
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tipe">
              {(a11y) => (
                <select
                  {...a11y}
                  name="tipe"
                  value={selectedTipe}
                  disabled
                  onChange={() => {}}
                  className={selectCls}
                >
                  {TIPE_OPTIONS.filter((item) => item.value === selectedTipe).map((tipe) => (
                    <option key={tipe.value} value={tipe.value}>
                      {tipe.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Semester" required>
              {(a11y) => (
                <select
                  {...a11y}
                  name="semester"
                  value={form.semester}
                  disabled={isEditMode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      semester: e.target.value,
                      tipe: getTipeBySemester(e.target.value),
                    }))
                  }
                  className={selectCls}
                >
                  <option value="">Pilih semester</option>
                  {assignedSemesterOptions.map((semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester} - {getTipeLabel(getTipeBySemester(semester))}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <Field label="Jalur">
            {(a11y) => (
              <select
                {...a11y}
                name="jalur_scope"
                value={form.jalur_scope}
                onChange={(e) => setForm((prev) => ({ ...prev, jalur_scope: e.target.value }))}
                className={selectCls}
              >
                {JALUR_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tanggal Mulai" required>
              {(a11y) => (
                <Input
                  {...a11y}
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                  className={inputCls}
                />
              )}
            </Field>

            <Field label="Tanggal Selesai" required>
              {(a11y) => (
                <Input
                  {...a11y}
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                  className={inputCls}
                />
              )}
            </Field>
          </div>

          <Field label="Deskripsi (opsional)">
            {(a11y) => (
              <Input
                {...a11y}
                name="deskripsi"
                value={form.deskripsi}
                onChange={(e) => setForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
                placeholder="Keterangan periode"
                className={inputCls}
              />
            )}
          </Field>

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <Button type="button" variant="outline" onClick={() => handleCloseModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : isEditMode ? 'Simpan' : 'Buat'}
            </Button>
          </div>
        </form>
      </DashboardDialog>

      <ConfirmActionDialog
        open={confirmCompleteOpen}
        onOpenChange={(open) => {
          if (completingId !== null && open === false) return;
          setConfirmCompleteOpen(open);
          if (!open) setTargetPeriode(null);
        }}
        title="Akhiri Periode"
        description={targetPeriode ? `Akhiri periode "${targetPeriode.nama}"? Periode aktif akan ditutup.` : 'Akhiri periode ini?'}
        confirmLabel="Akhiri"
        onConfirm={handleComplete}
        loading={completingId !== null}
        tone="warning"
      />
    </div>
  );
}
