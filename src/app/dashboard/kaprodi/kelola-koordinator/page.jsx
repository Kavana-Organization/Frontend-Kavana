'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { kaprodiAPI } from '@/lib/api';

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const SEMESTER_OPTIONS = [
  { value: '2', label: 'Proyek 1 (Semester 2)' },
  { value: '3', label: 'Proyek 2 (Semester 3)' },
  { value: '5', label: 'Proyek 3 (Semester 5)' },
  { value: '7', label: 'Internship 1 (Semester 7)' },
  { value: '8', label: 'Internship 2 (Semester 8)' },
];

const MAX_ASSIGNMENTS = 2;

export default function KelolaKoordinatorPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSemesterById, setSelectedSemesterById] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

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

      if (!exists && current.length >= MAX_ASSIGNMENTS) {
        toast.error(`Koordinator maksimal ${MAX_ASSIGNMENTS} assignment track/semester`);
        return prev;
      }

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

  const handleUnassign = async (dosen) => {
    const confirmed = window.confirm(`Hapus role koordinator dari ${dosen.nama}?`);
    if (!confirmed) return;

    setSubmittingId(dosen.id);
    try {
      const res = await kaprodiAPI.unassignKoordinatorSemester(dosen.id);
      if (res.ok) {
        toast.success(res.data?.message || 'Role koordinator berhasil dihapus');
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <UserCog className="h-4 w-4" /> Kelola Koordinator
          </CardTitle>
          <Input
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]"
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada data koordinator</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((k, i) => (
                <div
                  key={k.id || i}
                  className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3"
                >
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--ctp-teal)/0.20)] text-[hsl(var(--ctp-teal))] flex items-center justify-center text-sm font-bold">
                    {getInitials(k.nama)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{k.nama || '-'}</p>
                    <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{k.email || '-'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(Array.isArray(k.assigned_semesters) && k.assigned_semesters.length > 0)
                        ? k.assigned_semesters.map((semester) => {
                            const option = SEMESTER_OPTIONS.find((item) => Number(item.value) === Number(semester));
                            return (
                              <Badge
                                key={`${k.id}-assigned-${semester}`}
                                className="rounded-xl border border-[hsl(var(--ctp-blue)/0.35)] bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))]"
                              >
                                {option?.label || `Semester ${semester}`}
                              </Badge>
                            );
                          })
                        : (
                          <span className="text-xs text-[hsl(var(--ctp-subtext0))]">Belum ada assignment</span>
                        )}
                    </div>
                  </div>
                  <div className="flex min-w-[320px] flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {SEMESTER_OPTIONS.map((opt) => {
                        const selected = (selectedSemesterById[k.id] || []).includes(opt.value);
                        return (
                          <button
                            key={`${k.id}-${opt.value}`}
                            type="button"
                            onClick={() => handleSemesterChange(k.id, opt.value)}
                            disabled={submittingId === k.id}
                            className={`rounded-xl border px-3 py-2 text-xs transition-colors disabled:opacity-50 ${
                              selected
                                ? 'border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.15)] text-[hsl(var(--ctp-green))]'
                                : 'border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0)/0.45)] text-[hsl(var(--ctp-subtext1))]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[hsl(var(--ctp-subtext0))]">
                      Pilih maksimal {MAX_ASSIGNMENTS} track/semester per koordinator.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAssign(k)}
                      disabled={submittingId === k.id}
                      className="h-9 rounded-lg border border-[hsl(var(--ctp-blue)/0.4)] bg-[hsl(var(--ctp-blue)/0.16)] text-[hsl(var(--ctp-blue))] hover:bg-[hsl(var(--ctp-blue)/0.26)]"
                    >
                      {k.is_koordinator ? 'Update' : 'Assign'}
                    </Button>
                    {k.is_koordinator && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnassign(k)}
                        disabled={submittingId === k.id}
                        className="h-9 rounded-lg border border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.10)] text-[hsl(var(--ctp-red))] hover:bg-[hsl(var(--ctp-red)/0.18)]"
                      >
                        Cabut
                      </Button>
                    )}
                  </div>
                  <Badge
                    className={`rounded-xl border ${
                      k.is_koordinator
                        ? 'bg-[hsl(var(--ctp-green)/0.15)] text-[hsl(var(--ctp-green))] border-[hsl(var(--ctp-green)/0.3)]'
                        : 'bg-[hsl(var(--ctp-overlay0)/0.20)] text-[hsl(var(--ctp-subtext0))] border-[hsl(var(--ctp-overlay0)/0.35)]'
                    }`}
                  >
                    {k.is_koordinator ? 'Koordinator' : 'Dosen'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
