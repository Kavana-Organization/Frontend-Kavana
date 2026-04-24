'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Clock3, MapPin, Plus, UserRound, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

const INITIAL_FORM = { mahasiswa_id: '', penguji_id: '', tanggal: '', waktu: '', ruangan: '' };

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

function parseSelectedMahasiswaIds(value) {
  if (!value) return [];

  if (value.startsWith('group:')) {
    return value
      .slice('group:'.length)
      .split(',')
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  if (value.startsWith('mhs:')) {
    const id = Number(value.slice('mhs:'.length));
    return Number.isFinite(id) && id > 0 ? [id] : [];
  }

  const fallbackId = Number(value);
  return Number.isFinite(fallbackId) && fallbackId > 0 ? [fallbackId] : [];
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

function statusClass(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'completed') {
    return 'bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-green))] border-[hsl(var(--ctp-green)/0.35)]';
  }
  if (raw === 'ongoing') {
    return 'bg-[hsl(var(--ctp-peach)/0.20)] text-[hsl(var(--ctp-peach))] border-[hsl(var(--ctp-peach)/0.35)]';
  }
  return 'bg-[hsl(var(--ctp-blue)/0.20)] text-[hsl(var(--ctp-blue))] border-[hsl(var(--ctp-blue)/0.35)]';
}

export default function JadwalSidangPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [jadwal, setJadwal] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [mahasiswa, setMahasiswa] = useState([]);
  const [penguji, setPenguji] = useState([]);

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

      if (isProyek && entry?.kelompok_id) {
        const memberIds = availableMembers.map((member) => member.id);
        const groupName = entry.kelompok_nama || `Kelompok ${entry.kelompok_id}`;

        result.push({
          value: buildGroupOptionValue(memberIds),
          label: groupName,
          sortLabel: groupName,
        });
        return;
      }

      availableMembers.forEach((member) => {
        result.push({
          value: buildMahasiswaOptionValue(member.id),
          label: member.nama || entry.nama || '-',
          sortLabel: member.nama || entry.nama || '-',
        });
      });
    });

    const unique = new Map();
    result.forEach((item) => {
      if (!unique.has(item.value)) unique.set(item.value, item);
    });

    return Array.from(unique.values()).sort((a, b) => a.sortLabel.localeCompare(b.sortLabel));
  }, [mahasiswa, scheduledIds]);

  const hasRemainingCandidate = mahasiswaOptions.length > 0;

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
      penguji_id: Number(form.penguji_id),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls =
    'bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <CalendarClock className="h-4 w-4" /> Jadwal Sidang
          </CardTitle>
          <Button
            onClick={() => {
              setShowModal(true);
              setForm(INITIAL_FORM);
            }}
            disabled={!hasRemainingCandidate}
            className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)] disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-1" /> Jadwalkan
          </Button>
        </CardHeader>
        <CardContent>
          {jadwal.length === 0 ? (
            <div className="text-center py-12">
              <CalendarClock className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada jadwal sidang</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jadwal.map((j, i) => (
                <div
                  key={j.id || i}
                  className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">
                        {j.mahasiswa_nama || j.nama || '-'}
                      </p>
                      <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                        {j.npm || '-'} - {j.judul_proyek || '-'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--ctp-subtext1))]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {formatTanggal(j.tanggal)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatWaktu(j.waktu)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {j.ruangan || '-'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
                          Pembimbing: {j.dosen_nama || '-'}
                        </Badge>
                        <Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
                          Penguji: {j.penguji_nama || '-'}
                        </Badge>
                      </div>
                    </div>
                    <Badge className={`rounded-xl border ${statusClass(j.status)}`}>{statusLabel(j.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardDialog open={showModal} onOpenChange={setShowModal} title="Jadwalkan Sidang">
        <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-4">Jadwalkan Sidang</h3>
        <form onSubmit={handleSchedule} className="space-y-3">
          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Mahasiswa / Kelompok</Label>
            <Select
              value={form.mahasiswa_id}
              onValueChange={(value) => setForm({ ...form, mahasiswa_id: value })}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Pilih kelompok (proyek) / mahasiswa (internship)" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
                {mahasiswaOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Penguji Utama</Label>
            <Select
              value={form.penguji_id}
              onValueChange={(value) => setForm({ ...form, penguji_id: value })}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Pilih penguji" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
                {penguji.map((dosen) => (
                  <SelectItem key={dosen.id} value={String(dosen.id)}>
                    {dosen.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[hsl(var(--ctp-subtext1))]">Tanggal</Label>
              <Input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <Label className="text-[hsl(var(--ctp-subtext1))]">Waktu</Label>
              <Input
                type="time"
                value={form.waktu}
                onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Ruangan</Label>
            <Input
              value={form.ruangan}
              onChange={(e) => setForm({ ...form, ruangan: e.target.value })}
              placeholder="Contoh: Lab Informatika 301"
              className={inputCls}
            />
          </div>

          {!hasRemainingCandidate ? (
            <div className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] px-3 py-2 text-xs text-[hsl(var(--ctp-subtext0))] inline-flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Semua mahasiswa eligible sudah memiliki jadwal sidang.
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]"
            >
              <UserRound className="h-4 w-4 mr-1" />
              Jadwalkan
            </Button>
          </div>
        </form>
      </DashboardDialog>
    </motion.div>
  );
}
