'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

const API_TRACK_LABELS = {
  proyek1: 'Proyek 1',
  proyek2: 'Proyek 2',
  proyek3: 'Proyek 3',
  'proyek-1': 'Proyek 1',
  'proyek-2': 'Proyek 2',
  'proyek-3': 'Proyek 3',
  internship1: 'Internship 1',
  internship2: 'Internship 2',
  'internship-1': 'Internship 1',
  'internship-2': 'Internship 2',
};

const TRACKS = [
  { id: 'proyek-1', apiId: 'proyek1', name: 'Proyek 1', type: 'proyek', semester: 2, desc: 'Proyek kelompok semester 2', icon: Briefcase },
  { id: 'proyek-2', apiId: 'proyek2', name: 'Proyek 2', type: 'proyek', semester: 3, desc: 'Proyek kelompok semester 3', icon: Briefcase },
  { id: 'proyek-3', apiId: 'proyek3', name: 'Proyek 3', type: 'proyek', semester: 5, desc: 'Proyek kelompok semester 5', icon: Briefcase },
  { id: 'internship-1', apiId: 'internship1', name: 'Internship 1', type: 'internship', semester: 7, desc: 'Magang industri semester 7', icon: Building2 },
  { id: 'internship-2', apiId: 'internship2', name: 'Internship 2', type: 'internship', semester: 8, desc: 'Magang industri semester 8', icon: Building2 },
];
const TRACK_ORDER = TRACKS.reduce((acc, track) => ({ ...acc, [track.apiId]: track.semester }), {});

const ENROLLMENT_TYPE_CONFIG = {
  regular: { label: 'Regular', color: 'ctp-blue', icon: Briefcase },
  repeat: { label: 'Repeat', color: 'ctp-red', icon: RefreshCw },
  parallel_repeat: { label: 'Paralel', color: 'ctp-mauve', icon: Layers },
};

export default function TrackPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState(null);
  const [jalur, setJalur] = useState('regular');
  const [periodeActive, setPeriodeActive] = useState(false);
  const [eligibilities, setEligibilities] = useState([]);
  const [activeEnrollments, setActiveEnrollments] = useState([]);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [repeatInfo, setRepeatInfo] = useState({ repeat_required: false, repeat_track: null, next_allowed_track: null });
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [partnerNpm, setPartnerNpm] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAndLoad = async () => {
      try {
        const profileRes = await mahasiswaAPI.getProfile();
        if (profileRes.ok) {
          setJalur(profileRes.data?.jalur || 'regular');
        }

        const periodeRes = await mahasiswaAPI.getPeriodeAktif();
        if (periodeRes.ok) {
          const data = periodeRes.data;
          setSemester(data.semester);
          setPeriodeActive(Boolean(data.active));
          setJalur(data.jalur || profileRes.data?.jalur || 'regular');
          setEligibilityMessage(data.message || '');
          setRepeatInfo({
            repeat_required: Boolean(data.repeat_required),
            repeat_track: data.repeat_track || null,
            next_allowed_track: data.next_allowed_track || null,
          });

          const elig = Array.isArray(data.eligibilities) ? data.eligibilities : [];
          setEligibilities(elig);

          const enrolls = Array.isArray(data.active_enrollments) ? data.active_enrollments : [];
          setActiveEnrollments(enrolls);

          const eligibleTracks = elig.map((e) => e.track);
          const enrolledTracks = enrolls.map((e) => e.track);
          const unenrolledTracks = eligibleTracks.filter((t) => !enrolledTracks.includes(t));

          if (elig.length > 0 && unenrolledTracks.length === 0) {
            toast.info('Semua track yang tersedia sudah Anda ambil');
            router.replace('/dashboard/mahasiswa');
            return;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (role && role !== 'mahasiswa') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    checkAndLoad();
  }, [role, router]);

  const enrolledTracks = activeEnrollments.map((e) => e.track);
  const maxActiveTrackOrder = Math.max(0, ...activeEnrollments.map((e) => Number(TRACK_ORDER[e.track] || 0)));
  const unenrolledEligibilities = eligibilities.filter((e) => {
    if (enrolledTracks.includes(e.track)) return false;

    if (
      !repeatInfo.repeat_required &&
      e.enrollment_type === 'regular' &&
      maxActiveTrackOrder > 0 &&
      Number(TRACK_ORDER[e.track] || 0) <= maxActiveTrackOrder
    ) {
      return false;
    }

    return true;
  });

  const handleConfirm = async () => {
    if (!selectedTrack) {
      toast.warning('Pilih track terlebih dahulu');
      return;
    }
    const eligibility = unenrolledEligibilities.find((e) => e.track === selectedTrack);
    if (!eligibility) {
      toast.error('Track yang dipilih tidak eligible untuk Anda');
      return;
    }

    const track = TRACKS.find((t) => t.apiId === selectedTrack);
    if (track?.type === 'internship' && !companyName.trim()) {
      toast.error('Nama perusahaan wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mahasiswaAPI.setTrack(selectedTrack, partnerNpm || null);
      if (res.ok) {
        toast.success(`${API_TRACK_LABELS[selectedTrack] || selectedTrack} berhasil dipilih!`);
        if (track?.type === 'proyek' && !res.data?.matched) {
          router.push('/dashboard/mahasiswa/kelompok');
        } else {
          router.push('/dashboard/mahasiswa');
        }
      } else {
        toast.error(res.error || 'Gagal memilih track');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat status track" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Proyek & Internship"
        subtitle="Pilih jalur track akademik yang sesuai dengan semester berjalan dan pemenuhan syarat kurikulum."
      />

      {/* Active Enrollments Banner */}
      {activeEnrollments.length > 0 && (
        <Card variant="muted">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-semibold text-[var(--text-strong)] mb-2">Enrollment Aktif</p>
            <div className="flex flex-wrap gap-2">
              {activeEnrollments.map((e) => {
                const typeConf = ENROLLMENT_TYPE_CONFIG[e.enrollment_type] || ENROLLMENT_TYPE_CONFIG.regular;
                return (
                  <Badge
                    key={e.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {API_TRACK_LABELS[e.track] || e.track}
                    {e.enrollment_type !== 'regular' && ` (${typeConf.label})`}
                  </Badge>
                );
              })}
            </div>
            {unenrolledEligibilities.length > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Anda masih dapat mengambil track tambahan yang tersedia di bawah.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {unenrolledEligibilities.length === 0 && !periodeActive && activeEnrollments.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title={!semester ? 'Tidak Ada Proyek di Semester Ini' : 'Periode Proyek Belum Dibuka'}
          description={eligibilityMessage || 'Koordinator belum membuka periode pendaftaran. Silakan tunggu pengumuman jadwal dari prodi.'}
        />
      ) : unenrolledEligibilities.length === 0 && activeEnrollments.length > 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Semua Track Sudah Dipilih"
          description="Seluruh track yang eligible untuk semester aktif ini sudah Anda ambil."
          action={
            <Button onClick={() => router.push('/dashboard/mahasiswa')} className="min-h-[44px]">
              Kembali ke Dashboard
            </Button>
          }
        />
      ) : (
        <>
          <Card variant="muted">
            <CardContent className="flex flex-col gap-2 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-strong)]">
                  Jalur {jalur === 'rpl' ? 'RPL' : 'Regular'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {eligibilityMessage ||
                    (jalur === 'rpl'
                      ? 'Anda dapat memilih track mana pun yang sedang dibuka koordinator.'
                      : 'Pilihan track mengikuti semester berjalan dan periode yang dibuka koordinator.')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {jalur === 'regular' && semester ? (
                  <Badge variant="outline">Semester {semester}</Badge>
                ) : null}
                {repeatInfo.repeat_required && repeatInfo.repeat_track ? (
                  <Badge variant="destructive">
                    Wajib Ulang {API_TRACK_LABELS[repeatInfo.repeat_track] || repeatInfo.repeat_track}
                  </Badge>
                ) : null}
                {!repeatInfo.repeat_required && repeatInfo.next_allowed_track ? (
                  <Badge variant="outline">
                    Izin Lanjut {API_TRACK_LABELS[repeatInfo.next_allowed_track] || repeatInfo.next_allowed_track}
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {unenrolledEligibilities.map((elig) => {
              const track = TRACKS.find((t) => t.apiId === elig.track);
              const Icon = track?.icon || Briefcase;
              const isSelected = selectedTrack === elig.track;
              const typeConf = ENROLLMENT_TYPE_CONFIG[elig.enrollment_type] || ENROLLMENT_TYPE_CONFIG.regular;

              return (
                <Card
                  variant={isSelected ? 'default' : 'muted'}
                  key={elig.track}
                  className={cn(
                    'cursor-pointer transition-all border p-5',
                    isSelected
                      ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--surface-raised)]'
                      : 'border-[var(--line)] hover:border-[var(--text-muted)]'
                  )}
                  onClick={() => setSelectedTrack(elig.track)}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)]">
                      <Icon className="h-5 w-5 text-[var(--text-strong)]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-[var(--text-strong)]">
                        {API_TRACK_LABELS[elig.track] || elig.track}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1 break-words">
                        {elig.reason || track?.desc || ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <Badge variant="outline" className="text-[10px]">
                          {typeConf.label}
                        </Badge>
                        {elig.is_rpl_fallback && (
                          <Badge variant="secondary" className="text-[10px]">
                            Via RPL
                          </Badge>
                        )}
                        {elig.jadwal_nama && (
                          <Badge variant="outline" className="text-[10px]">
                            {elig.jadwal_nama}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-[hsl(var(--ctp-green))] shrink-0" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {selectedTrack && (() => {
            const track = TRACKS.find((t) => t.apiId === selectedTrack);
            const elig = unenrolledEligibilities.find((e) => e.track === selectedTrack);
            const typeConf = ENROLLMENT_TYPE_CONFIG[elig?.enrollment_type] || ENROLLMENT_TYPE_CONFIG.regular;

            return (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <Card variant="muted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                      <span>Konfirmasi: {API_TRACK_LABELS[selectedTrack] || selectedTrack}</span>
                      <Badge variant="outline" className="text-xs">
                        {typeConf.label}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-[var(--text-muted)]">
                      {track?.type === 'proyek'
                        ? 'Proyek dikerjakan 2 orang per kelompok. Anda dapat mencantumkan NPM partner sekarang atau bergabung kemudian.'
                        : 'Internship dilakukan secara individual di perusahaan mitra.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {track?.type === 'proyek' ? (
                      <Field
                        label="NPM Partner (opsional)"
                        hint="Jika diisi, kelompok otomatis terbentuk saat partner mendaftar dengan NPM Anda."
                      >
                        <Input
                          placeholder="Masukkan NPM partner (opsional)"
                          value={partnerNpm}
                          onChange={(e) => setPartnerNpm(e.target.value)}
                          className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
                        />
                      </Field>
                    ) : (
                      <div className="space-y-4">
                        <Field label="Nama Perusahaan" required>
                          <Input
                            placeholder="PT. Contoh Mitra Industri"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
                          />
                        </Field>
                        <Field label="Alamat Perusahaan">
                          <Input
                            placeholder="Alamat lengkap lokasi magang"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
                          />
                        </Field>
                      </div>
                    )}

                    <div className="flex gap-3 pt-3 border-t border-[var(--line)]">
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedTrack(null)}
                        className="min-h-[44px]"
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="min-h-[44px]"
                      >
                        <span>{submitting ? 'Memproses...' : 'Pilih & Konfirmasi Track'}</span>
                        <ChevronRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })()}
        </>
      )}
    </motion.div>
  );
}
