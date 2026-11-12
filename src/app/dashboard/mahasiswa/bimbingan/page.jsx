'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  Edit,
  Download,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

const MAX_SESSIONS = 8;

function toDateInputValue(value) {
  if (!value) return '';
  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayDateInputValue() {
  return toDateInputValue(new Date());
}

function maxDateValue(first, second) {
  if (!first) return second || '';
  if (!second) return first;
  return first > second ? first : second;
}

export default function BimbinganPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [hasPembimbing, setHasPembimbing] = useState(false);
  const [dosenNama, setDosenNama] = useState('');
  const [trackName, setTrackName] = useState('');
  const [judulProyek, setJudulProyek] = useState('');
  const [bimbinganStartDate, setBimbinganStartDate] = useState('');
  const [bimbinganEndDate, setBimbinganEndDate] = useState('');
  const [bimbinganScheduleStatus, setBimbinganScheduleStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [form, setForm] = useState({ date: '', topic: '', notes: '' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (role && role !== 'mahasiswa') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadAll();
  }, [role, router]);

  const loadAll = async () => {
    try {
      const profileRes = await mahasiswaAPI.getProfile();
      if (profileRes.ok) {
        const p = (profileRes.data?.data && typeof profileRes.data.data === 'object')
          ? profileRes.data.data
          : (profileRes.data || {});
        setTrackName(p.track || '');
        setDosenNama(p.dosen_nama || '');
        setJudulProyek(p.judul_proyek || '');
        setHasPembimbing(p.status_proposal === 'approved' && Boolean(p.dosen_nama));
        const approvedEnrollment = Array.isArray(p.enrollments)
          ? p.enrollments.find((e) => e.status_proposal === 'approved' && e.dosen_id)
          : null;
        setBimbinganStartDate(toDateInputValue(p.bimbingan_start_at || approvedEnrollment?.updated_at || p.updated_at || p.created_at));
        setBimbinganEndDate(toDateInputValue(p.bimbingan_end_at || approvedEnrollment?.jadwal_end_date));
        setBimbinganScheduleStatus(p.bimbingan_schedule_status || approvedEnrollment?.jadwal_status || '');
      }
      const bimRes = await mahasiswaAPI.getMyBimbingan();
      if (bimRes.ok) {
        const rawList = Array.isArray(bimRes.data)
          ? bimRes.data
          : Array.isArray(bimRes.data?.data)
          ? bimRes.data.data
          : [];
        setSessions(rawList.map((b) => ({
          id: b.id,
          date: toDateInputValue(b.tanggal),
          topic: b.topik || b.kegiatan || '',
          notes: b.catatan || '',
          mingguKe: b.minggu_ke,
          status: b.status || 'pending',
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    if (!hasPembimbing) {
      toast.warning('Upload proposal dan dapatkan dosen pembimbing terlebih dahulu.');
      return;
    }
    if (activeSessionCount >= MAX_SESSIONS) {
      toast.info('Bimbingan aktif sudah mencapai 8 sesi. Tunggu review dosen atau ajukan ulang jika ada yang ditolak.');
      return;
    }
    if (isScheduleCompleted) {
      toast.warning('Jadwal proyek sudah selesai. Bimbingan baru tidak bisa ditambahkan.');
      return;
    }
    if (bimbinganEndDate && todayDateInputValue() > bimbinganEndDate) {
      toast.warning(`Jadwal proyek sudah berakhir pada ${bimbinganEndDate}. Bimbingan baru tidak bisa ditambahkan.`);
      return;
    }
    setEditIdx(-1);
    setForm({ date: maxDateValue(todayDateInputValue(), bimbinganStartDate), topic: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (i) => {
    setEditIdx(i);
    setForm({ date: sessions[i].date, topic: sessions[i].topic, notes: sessions[i].notes });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.date || !form.topic || !form.notes) {
      toast.error('Semua field wajib diisi');
      return;
    }
    if (bimbinganStartDate && form.date < bimbinganStartDate) {
      toast.error(`Tanggal bimbingan tidak boleh sebelum ${bimbinganStartDate}`);
      return;
    }
    if (bimbinganEndDate && form.date > bimbinganEndDate) {
      toast.error(`Tanggal bimbingan tidak boleh melebihi jadwal proyek (${bimbinganEndDate})`);
      return;
    }
    try {
      const res = await mahasiswaAPI.createBimbingan({
        tanggal: form.date,
        minggu_ke: nextSessionNumber,
        topik: form.topic,
        catatan: form.notes,
      });
      if (res.ok) {
        toast.success('Bimbingan berhasil disimpan');
        setShowModal(false);
        loadAll();
      } else {
        toast.error(res.error || 'Gagal menyimpan');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  const approvedCount = sessions.filter((s) => s.status === 'approved').length;
  const activeSessionCount = sessions.filter((s) => s.status !== 'rejected').length;
  const nextSessionNumber = Math.min(MAX_SESSIONS, activeSessionCount + 1);
  const isScheduleCompleted = String(bimbinganScheduleStatus || '').toLowerCase() === 'completed';
  const isScheduleEnded = Boolean(bimbinganEndDate && todayDateInputValue() > bimbinganEndDate);
  const canAddBimbingan = activeSessionCount < MAX_SESSIONS && !isScheduleEnded && !isScheduleCompleted;
  const canExport = hasPembimbing && Boolean(judulProyek) && approvedCount > 0;

  const handleExport = async (format) => {
    if (!canExport || exporting) return;
    setExporting(true);
    try {
      const res = await mahasiswaAPI.exportBimbingan(format);
      if (res.ok) {
        toast.success(`Formulir bimbingan ${format.toUpperCase()} berhasil diunduh`);
      } else {
        toast.error(res.error || 'Gagal mengunduh formulir');
      }
    } catch {
      toast.error('Kesalahan jaringan saat export');
    } finally {
      setExporting(false);
    }
  };

  const progress = (approvedCount / MAX_SESSIONS) * 100;

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat catatan bimbingan" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Bimbingan Online"
        subtitle="Catat dan pantau sesi bimbingan bersama dosen pembimbing hingga memenuhi kuota 8 sesi sidang."
      />

      {/* Info summary strip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card variant="muted">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-[var(--text-muted)]">Track Aktif</p>
            <p className="text-base font-semibold text-[var(--text-strong)] mt-1 truncate">
              {trackName || 'Belum dipilih'}
            </p>
          </CardContent>
        </Card>
        <Card variant="muted">
          <CardContent className="p-5 min-w-0">
            <p className="text-xs font-medium text-[var(--text-muted)]">Dosen Pembimbing</p>
            <p className="text-base font-semibold text-[var(--text-strong)] mt-1 truncate" title={dosenNama}>
              {hasPembimbing ? dosenNama : <span className="text-[hsl(var(--ctp-peach))]">Belum ada</span>}
            </p>
          </CardContent>
        </Card>
        <Card variant="muted">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--text-muted)]">Progres Sesi</p>
              <span className="text-sm font-semibold font-mono tabular-nums text-[var(--text-strong)]">
                {approvedCount}/{MAX_SESSIONS} Selesai
              </span>
            </div>
            <Progress value={progress} className="mt-2.5 h-2" />
            <div className="flex gap-1 mt-2">
              {Array.from({ length: MAX_SESSIONS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < approvedCount
                      ? 'bg-[hsl(var(--ctp-green))]'
                      : i < activeSessionCount
                      ? 'bg-[hsl(var(--ctp-peach))]'
                      : 'bg-[var(--surface-sunken)] border border-[var(--line)]'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions list */}
      <Card variant="muted">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <MessageSquare className="h-4 w-4" /> Catatan Bimbingan
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Riwayat konsultasi bimbingan proyek Anda.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canExport || exporting}
                  className="min-h-[44px]"
                  title={!canExport ? 'Perlu pembimbing, judul, dan minimal 1 bimbingan disetujui' : 'Export formulir bimbingan'}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  <span>{exporting ? 'Mengunduh...' : 'Export'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[var(--surface-raised)] border-[var(--line)]">
                <DropdownMenuItem
                  onClick={() => handleExport('pdf')}
                  disabled={!canExport || exporting}
                  className="cursor-pointer text-[var(--text-strong)] focus:bg-[var(--surface-sunken)]"
                >
                  <FileText className="h-4 w-4 mr-2" /> Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={openAdd}
              disabled={!canAddBimbingan}
              className="min-h-[44px]"
              title={
                isScheduleCompleted
                  ? 'Jadwal proyek sudah selesai'
                  : isScheduleEnded
                  ? `Jadwal proyek sudah berakhir pada ${bimbinganEndDate}`
                  : undefined
              }
            >
              <Plus className="h-4 w-4 mr-1.5" /> Tambah Sesi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Belum ada catatan bimbingan"
              description="Catatan bimbingan Anda bersama dosen pembimbing akan ditampilkan di sini."
              action={
                <Button onClick={openAdd} disabled={!canAddBimbingan} className="min-h-[44px]">
                  <Plus className="h-4 w-4 mr-1.5" /> Catat bimbingan
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <div
                  key={s.id || i}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] flex items-start gap-3 p-3.5"
                >
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--surface-raised)] border border-[var(--line)] text-[var(--text-strong)] flex items-center justify-center text-sm font-semibold font-mono tabular-nums">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {s.date || '-'}
                      </span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-strong)] break-words">
                      {s.topic}
                    </p>
                    {s.notes && (
                      <p className="text-xs text-[var(--text-body)] mt-1 whitespace-pre-line break-words line-clamp-3">
                        {s.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(i)}
                    aria-label={`Edit bimbingan ke-${i + 1}`}
                    className="shrink-0 h-11 w-11 text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <DashboardDialog open={showModal} onOpenChange={setShowModal}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-strong)]">
              {editIdx >= 0 ? `Edit Bimbingan ke-${editIdx + 1}` : `Tambah Bimbingan ke-${nextSessionNumber}`}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Isi data konsultasi bimbingan yang telah disepakati bersama dosen pembimbing.
            </p>
          </div>

          <div data-testid="bimbingan-form" className="space-y-4">
            <Field
              label="Tanggal"
              required
              hint={
                bimbinganStartDate || bimbinganEndDate
                  ? `Rentang tanggal bimbingan: ${bimbinganStartDate || '-'} sampai ${bimbinganEndDate || '-'}`
                  : undefined
              }
            >
              <Input
                type="date"
                min={bimbinganStartDate || undefined}
                max={bimbinganEndDate || undefined}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
              />
            </Field>

            <Field label="Topik / Kegiatan" required>
              <Input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="Topik pembahasan bimbingan"
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
              />
            </Field>

            <Field label="Catatan" required>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan hasil diskusi atau arahan revisi dari dosen"
                rows={3}
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="min-h-[44px]"
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} className="min-h-[44px]">
              Simpan
            </Button>
          </div>
        </div>
      </DashboardDialog>
    </motion.div>
  );
}
