'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, Pencil, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))]" />
      </div>
    );
  }

  const inputCls = 'bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <CalendarDays className="h-4 w-4" /> Kelola Periode
          </CardTitle>
          <Button
            onClick={openCreateModal}
            disabled={!hasAssignments}
            className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]"
          >
            <Plus className="mr-1 h-4 w-4" /> Buat Periode
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {hasAssignments ? (
              assignedSemesterOptions.map((semester) => (
                <Badge
                  key={`assignment-${semester}`}
                  className="rounded-xl border border-[hsl(var(--ctp-blue)/0.35)] bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))]"
                >
                  Semester {semester} - {getTipeLabel(getTipeBySemester(semester))}
                </Badge>
              ))
            ) : (
              <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.25)] text-[hsl(var(--ctp-subtext0))]">
                Belum ada assignment dari kaprodi
              </Badge>
            )}
          </div>
          {periodes.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-[hsl(var(--ctp-overlay1))]" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada periode</p>
            </div>
          ) : (
            <div className="space-y-2">
              {periodes.map((periode) => {
                const active = isPeriodeActive(periode);
                return (
                  <div
                    key={periode.id}
                    className={`rounded-2xl border p-4 ${
                      active
                        ? 'border-[hsl(var(--ctp-green)/0.45)] bg-[hsl(var(--ctp-green)/0.06)]'
                        : 'border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)]'
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{periode.nama}</h3>
                          <Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
                            {getTipeLabel(periode.tipe)}
                          </Badge>
                          {periode.semester ? (
                            <Badge className="rounded-xl bg-[hsl(var(--ctp-blue)/0.15)] text-[hsl(var(--ctp-blue))] border border-[hsl(var(--ctp-blue)/0.35)]">
                              Semester {periode.semester}
                            </Badge>
                          ) : null}
                          <Badge className="rounded-xl bg-[hsl(var(--ctp-lavender)/0.15)] text-[hsl(var(--ctp-lavender))] border border-[hsl(var(--ctp-lavender)/0.35)]">
                            {getJalurScopeLabel(periode.jalur_scope)}
                          </Badge>
                          <Badge
                            className={`rounded-xl border ${
                              active
                                ? 'bg-[hsl(var(--ctp-green)/0.15)] text-[hsl(var(--ctp-green))] border-[hsl(var(--ctp-green)/0.35)]'
                                : 'bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border-[hsl(var(--ctp-overlay0)/0.35)]'
                            }`}
                          >
                            {active ? 'Aktif' : 'Selesai'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-[hsl(var(--ctp-subtext0))]">
                          {periode.start_date || '-'} - {periode.end_date || '-'}
                        </p>
                        {periode.deskripsi ? (
                          <p className="mt-2 text-xs text-[hsl(var(--ctp-subtext1))]">{periode.deskripsi}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => openEditModal(periode)}
                          className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]"
                        >
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        {active ? (
                          <Button
                            type="button"
                            disabled={completingId === periode.id}
                            onClick={() => {
                              setTargetPeriode(periode);
                              setConfirmCompleteOpen(true);
                            }}
                            className="rounded-xl bg-[hsl(var(--ctp-peach)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-peach)/0.35)]"
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            {completingId === periode.id ? 'Memproses...' : 'Akhiri'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardDialog
        open={showModal}
        onOpenChange={handleCloseModal}
        title={isEditMode ? 'Edit Periode' : 'Buat Periode Baru'}
      >
        <h3 className="mb-4 text-lg font-semibold text-[hsl(var(--ctp-text))]">
          {isEditMode ? 'Edit Periode' : 'Buat Periode Baru'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Nama Periode</Label>
            <Input
              value={form.nama}
              onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
              placeholder="Contoh: Proyek 1 Angkatan 24"
              className={inputCls}
            />
          </div>

          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Tipe</Label>
            <select
              value={selectedTipe}
              disabled
              onChange={() => {}}
              className={`${inputCls} h-10 w-full rounded-md px-3 disabled:opacity-60`}
            >
              {TIPE_OPTIONS.filter((item) => item.value === selectedTipe).map((tipe) => (
                <option key={tipe.value} value={tipe.value}>
                  {tipe.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Semester</Label>
            <select
              value={form.semester}
              disabled={isEditMode}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  semester: e.target.value,
                  tipe: getTipeBySemester(e.target.value),
                }))
              }
              className={`${inputCls} h-10 w-full rounded-md px-3 disabled:opacity-60`}
            >
              <option value="">Pilih semester</option>
              {assignedSemesterOptions.map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester} - {getTipeLabel(getTipeBySemester(semester))}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Jalur</Label>
            <select
              value={form.jalur_scope}
              onChange={(e) => setForm((prev) => ({ ...prev, jalur_scope: e.target.value }))}
              className={`${inputCls} h-10 w-full rounded-md px-3`}
            >
              {JALUR_SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Tanggal Mulai</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Tanggal Selesai</Label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Deskripsi (opsional)</Label>
            <Input
              value={form.deskripsi}
              onChange={(e) => setForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Keterangan periode"
              className={inputCls}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={() => handleCloseModal(false)}
              className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]"
            >
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
    </motion.div>
  );
}
