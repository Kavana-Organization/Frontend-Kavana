'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, Clock3, GraduationCap, MapPin, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';
import { useAuthStore } from '@/store/auth-store';
import { pengujiAPI } from '@/lib/api';

const HASIL_OPTIONS = [
  { value: 'lulus', label: 'Lulus (Tanpa Revisi)' },
  { value: 'lulus_revisi', label: 'Lulus dengan Revisi' },
  { value: 'tidak_lulus', label: 'Tidak Lulus' },
];

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getProfileIds(profile) {
  return [profile?.id, profile?.dosen_id, profile?.user_id]
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function isMySidang(item, profile) {
  const profileIds = getProfileIds(profile);
  const pengujiId = Number(item?.penguji_id);
  if (profileIds.length > 0 && Number.isFinite(pengujiId)) {
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

function hasilLabel(value) {
  return HASIL_OPTIONS.find((option) => option.value === value)?.label || value || '-';
}

export default function PengujiSidangPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [sidang, setSidang] = useState([]);
  const [hasilTarget, setHasilTarget] = useState(null);
  const [hasilForm, setHasilForm] = useState({ hasil_sidang: 'lulus', catatan_sidang: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role && role !== 'penguji') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const [profileRes, sidangRes] = await Promise.all([
        pengujiAPI.getProfile(),
        pengujiAPI.getSidangList(),
      ]);
      const nextProfile = profileRes.ok ? profileRes.data : null;
      const rows = sidangRes.ok
        ? (Array.isArray(sidangRes.data) ? sidangRes.data : sidangRes.data?.data || [])
        : [];
      setProfile(nextProfile);
      setSidang(rows.filter((item) => isMySidang(item, nextProfile)));
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

  const openHasil = (item) => {
    setHasilTarget(item);
    setHasilForm({
      hasil_sidang: item?.hasil_sidang || 'lulus',
      catatan_sidang: item?.catatan_sidang || '',
    });
  };

  const handleSubmitHasil = async (event) => {
    event.preventDefault();
    if (!hasilTarget) return;
    setSubmitting(true);
    try {
      const result = await pengujiAPI.setHasilSidang(hasilTarget.id, {
        hasil_sidang: hasilForm.hasil_sidang,
        catatan_sidang: hasilForm.catatan_sidang.trim() || undefined,
      });
      if (result.ok) {
        toast.success(result.data?.message || 'Hasil sidang berhasil disimpan');
        setHasilTarget(null);
        loadData();
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total sidang', stats.total, 'Semua sidang penguji'],
          ['Perlu hasil', stats.pending, 'Menunggu keputusan'],
          ['Revisi', stats.revisi, 'Ditetapkan perlu revisi'],
          ['Selesai', stats.completed, 'Hasil sudah disimpan'],
        ].map(([title, value, caption]) => (
          <Card key={title} className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
            <CardHeader className="pb-2">
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">{title}</p>
              <CardTitle className="text-2xl text-[hsl(var(--ctp-text))]">{value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[hsl(var(--ctp-subtext0))]">{caption}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <GraduationCap className="h-4 w-4" /> Sidang Penguji
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sidang.length === 0 ? (
            <div className="text-center py-12">
              <CalendarClock className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada jadwal sidang untuk penguji ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sidang.map((item) => {
                const isCompleted = String(item?.status || '').toLowerCase() === 'completed';
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">
                          {item.display_nama || item.mahasiswa_nama || '-'}
                        </p>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                          {item.display_npm || item.npm || '-'} - {item.judul_proyek || '-'}
                        </p>
                        {Array.isArray(item?.anggota_nama) && item.anggota_nama.length > 1 ? (
                          <p className="mt-1 text-xs text-[hsl(var(--ctp-subtext1))]">
                            Anggota: {item.anggota_nama.join(', ')}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--ctp-subtext1))]">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatTanggal(item.tanggal)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatWaktu(item.waktu)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.ruangan || '-'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
                            Pembimbing: {item.dosen_nama || '-'}
                          </Badge>
                          <Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
                            Penguji: {item.penguji_nama || profile?.nama || '-'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge className={`rounded-xl border ${statusClass(item.status)}`}>{statusLabel(item.status)}</Badge>
                        {isCompleted ? (
                          <Badge className="rounded-xl border bg-[hsl(var(--ctp-blue)/0.15)] text-[hsl(var(--ctp-blue))] border-[hsl(var(--ctp-blue)/0.35)]">
                            {hasilLabel(item.hasil_sidang)}
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => openHasil(item)}
                            className="h-auto rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] px-3 py-1 text-xs text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Tentukan Hasil
                          </Button>
                        )}
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
        open={!!hasilTarget}
        onOpenChange={(open) => { if (!open) setHasilTarget(null); }}
        title="Tentukan Hasil Sidang"
      >
        {hasilTarget ? (
          <form onSubmit={handleSubmitHasil} className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))]">Tentukan Hasil Sidang</h3>
              <p className="text-sm text-[hsl(var(--ctp-subtext1))]">
                {hasilTarget.display_nama || hasilTarget.mahasiswa_nama || '-'} - {formatTanggal(hasilTarget.tanggal)} {formatWaktu(hasilTarget.waktu)}
              </p>
            </div>
            <div>
              <Label className="text-[hsl(var(--ctp-subtext1))]">Hasil Sidang</Label>
              <Select value={hasilForm.hasil_sidang} onValueChange={(value) => setHasilForm({ ...hasilForm, hasil_sidang: value })}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Pilih hasil" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
                  {HASIL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[hsl(var(--ctp-subtext1))]">Catatan Sidang</Label>
              <Textarea
                rows={4}
                value={hasilForm.catatan_sidang}
                onChange={(event) => setHasilForm({ ...hasilForm, catatan_sidang: event.target.value })}
                placeholder="Isi catatan keputusan, poin revisi, atau alasan tidak lulus"
                className={inputCls}
              />
            </div>
            <div className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] px-3 py-2 text-xs text-[hsl(var(--ctp-subtext0))]">
              {hasilForm.hasil_sidang === 'lulus_revisi'
                ? 'Jika dipilih lulus dengan revisi, mahasiswa akan masuk ke alur revisi sidang.'
                : 'Keputusan ini akan menyimpan hasil sidang mahasiswa.'}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setHasilTarget(null)}
                className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]"
              >
                <UserRound className="h-4 w-4 mr-1" />
                {submitting ? 'Menyimpan...' : 'Simpan Hasil'}
              </Button>
            </div>
          </form>
        ) : null}
      </DashboardDialog>
    </motion.div>
  );
}
