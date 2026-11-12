'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog';
import { useAuthStore } from '@/store/auth-store';
import { kaprodiAPI } from '@/lib/api';

const SEMESTER_OPTIONS = [
  { value: '2', label: 'Proyek 1 (Semester 2)' },
  { value: '3', label: 'Proyek 2 (Semester 3)' },
  { value: '5', label: 'Proyek 3 (Semester 5)' },
  { value: '7', label: 'Internship 1 (Semester 7)' },
  { value: '8', label: 'Internship 2 (Semester 8)' },
];

export default function KelolaKoordinatorPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSemesterById, setSelectedSemesterById] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [confirmUnassignOpen, setConfirmUnassignOpen] = useState(false);
  const [targetKoordinator, setTargetKoordinator] = useState(null);

  useEffect(() => {
    if (role && role !== 'kaprodi') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const res = (await kaprodiAPI.getKoordinatorList?.()) || { ok: true, data: [] };
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedSemesterById(() => {
      const next = {};
      list.forEach((item) => {
        next[item.id] = Array.isArray(item.assigned_semesters)
          ? item.assigned_semesters.map((value) => String(value))
          : item.assigned_semester
            ? [String(item.assigned_semester)]
            : [];
      });
      return next;
    });
  }, [list]);

  const handleSemesterChange = (dosenId, semester) => {
    setSelectedSemesterById((prev) => {
      const current = Array.isArray(prev[dosenId]) ? prev[dosenId] : [];
      const exists = current.includes(semester);

      return {
        ...prev,
        [dosenId]: exists
          ? current.filter((value) => value !== semester)
          : [...current, semester].sort((a, b) => Number(a) - Number(b)),
      };
    });
  };

  const handleAssign = async (dosen) => {
    const selectedSemesters = Array.isArray(selectedSemesterById[dosen.id]) ? selectedSemesterById[dosen.id] : [];
    if (selectedSemesters.length === 0) {
      toast.error('Pilih minimal satu track/semester');
      return;
    }

    setSubmittingId(dosen.id);
    try {
      const res = await kaprodiAPI.assignKoordinatorSemester(
        dosen.id,
        selectedSemesters.map((value) => Number(value))
      );
      if (res.ok) {
        toast.success(res.data?.message || 'Koordinator berhasil diassign');
        await loadData();
      } else {
        toast.error(res.error || 'Gagal assign koordinator');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleUnassign = async () => {
    if (!targetKoordinator) return;
    setSubmittingId(targetKoordinator.id);
    try {
      const res = await kaprodiAPI.unassignKoordinatorSemester(targetKoordinator.id);
      if (res.ok) {
        toast.success(res.data?.message || 'Role koordinator berhasil dihapus');
        setConfirmUnassignOpen(false);
        setTargetKoordinator(null);
        await loadData();
      } else {
        toast.error(res.error || 'Gagal menghapus role koordinator');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmittingId(null);
    }
  };

  const filtered = list.filter((m) => !search || (m.nama || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <LoadingState variant="table" label="Memuat data penetapan koordinator" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola & Validasi Akhir Koordinator"
        subtitle="Tetapkan dosen koordinator dan pantau distribusi kewenangan semester pada program studi."
      />

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <UserCog className="h-4 w-4 shrink-0" />
              <span>Penetapan Koordinator Semester</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Pilih satu atau lebih semester untuk menetapkan hak kelola koordinator.
            </CardDescription>
          </div>
          <div className="w-full sm:w-64">
            <Field label="Cari dosen">
              {(a11y) => (
                <Input
                  {...a11y}
                  name="search"
                  placeholder="Nama dosen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Belum ada data koordinator untuk dipantau"
              description="Data dosen kandidat koordinator akan muncul setelah terdaftar atau sesuai pencarian Anda."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((k, i) => (
                <div
                  key={k.id || i}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--text-strong)] break-words">
                        {k.nama || '-'}
                      </p>
                      <StatusBadge
                        status={k.is_koordinator ? 'active' : 'neutral'}
                        label={k.is_koordinator ? 'Koordinator' : 'Dosen'}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] break-all">{k.email || '-'}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Array.isArray(k.assigned_semesters) && k.assigned_semesters.length > 0 ? (
                        k.assigned_semesters.map((semester) => {
                          const option = SEMESTER_OPTIONS.find((item) => Number(item.value) === Number(semester));
                          return (
                            <Badge key={`${k.id}-assigned-${semester}`} variant="outline">
                              {option?.label || `Semester ${semester}`}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Belum ada assignment</span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div
                      role="group"
                      aria-label={`Pilih semester koordinator untuk ${k.nama || 'dosen'}`}
                      className="flex flex-wrap gap-2"
                    >
                      {SEMESTER_OPTIONS.map((opt) => {
                        const selected = (selectedSemesterById[k.id] || []).includes(opt.value);
                        return (
                          <Button
                            key={`${k.id}-${opt.value}`}
                            type="button"
                            size="sm"
                            variant={selected ? 'default' : 'outline'}
                            aria-pressed={selected}
                            onClick={() => handleSemesterChange(k.id, opt.value)}
                            disabled={submittingId === k.id}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Pilih satu atau lebih track/semester untuk koordinator ini.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAssign(k)}
                      disabled={submittingId === k.id}
                    >
                      {k.is_koordinator ? 'Update' : 'Assign'}
                    </Button>
                    {k.is_koordinator && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetKoordinator(k);
                          setConfirmUnassignOpen(true);
                        }}
                        disabled={submittingId === k.id}
                      >
                        Cabut
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={confirmUnassignOpen}
        onOpenChange={(open) => {
          if (submittingId !== null && open === false) return;
          setConfirmUnassignOpen(open);
          if (!open) setTargetKoordinator(null);
        }}
        title="Cabut Role Koordinator"
        description={targetKoordinator ? `Hapus role koordinator dari ${targetKoordinator.nama}?` : 'Hapus role koordinator ini?'}
        confirmLabel="Cabut Role"
        onConfirm={handleUnassign}
        loading={submittingId !== null}
      />
    </div>
  );
}
