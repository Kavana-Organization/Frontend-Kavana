'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Building2, Users, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  RefreshCw, Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';

const TRACK_LABELS = {
  'proyek-1': 'Proyek 1', 'proyek-2': 'Proyek 2', 'proyek-3': 'Proyek 3',
  'internship-1': 'Internship 1', 'internship-2': 'Internship 2',
};
const API_TRACK_LABELS = {
  proyek1: 'Proyek 1', proyek2: 'Proyek 2', proyek3: 'Proyek 3',
  internship1: 'Internship 1', internship2: 'Internship 2',
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
          setPeriodeActive(!!data.active);
          setJalur(data.jalur || profileRes.data?.jalur || 'regular');
          setEligibilityMessage(data.message || '');
          setRepeatInfo({
            repeat_required: !!data.repeat_required,
            repeat_track: data.repeat_track || null,
            next_allowed_track: data.next_allowed_track || null,
          });

          // Set eligibilities from backend
          const elig = Array.isArray(data.eligibilities) ? data.eligibilities : [];
          setEligibilities(elig);

          // Set active enrollments
          const enrolls = Array.isArray(data.active_enrollments) ? data.active_enrollments : [];
          setActiveEnrollments(enrolls);

          // Only redirect if ALL eligible tracks are already enrolled
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

    if (role && role !== 'mahasiswa') { router.replace(`/dashboard/${role}`); return; }
    checkAndLoad();
  }, [role, router]);

  // Filter to only show eligible tracks NOT yet enrolled
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
    if (!selectedTrack) return;
    const eligibility = unenrolledEligibilities.find((e) => e.track === selectedTrack);
    if (!eligibility) return;

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
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
      {/* Active Enrollments Banner */}
      {activeEnrollments.length > 0 && (
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="py-4">
            <p className="text-sm font-semibold text-[hsl(var(--ctp-text))] mb-2">Enrollment Aktif</p>
            <div className="flex flex-wrap gap-2">
              {activeEnrollments.map((e) => {
                const typeConf = ENROLLMENT_TYPE_CONFIG[e.enrollment_type] || ENROLLMENT_TYPE_CONFIG.regular;
                return (
                  <Badge
                    key={e.id}
                    className={`rounded-xl border border-[hsl(var(--${typeConf.color})/0.35)] bg-[hsl(var(--${typeConf.color})/0.12)] text-[hsl(var(--${typeConf.color}))]`}
                  >
                    {API_TRACK_LABELS[e.track] || e.track}
                    {e.enrollment_type !== 'regular' && ` (${typeConf.label})`}
                  </Badge>
                );
              })}
            </div>
            {unenrolledEligibilities.length > 0 && (
              <p className="text-xs text-[hsl(var(--ctp-subtext0))] mt-2">
                Anda masih bisa mengambil track tambahan di bawah.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {unenrolledEligibilities.length === 0 && !periodeActive && activeEnrollments.length === 0 ? (
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] mb-4">
              <AlertTriangle className="h-8 w-8 text-[hsl(var(--ctp-peach))]" />
            </div>
            <h2 className="text-xl font-semibold text-[hsl(var(--ctp-text))] mb-2">
              {!semester ? 'Tidak Ada Proyek di Semester Ini' : 'Periode Proyek Belum Dibuka'}
            </h2>
            <p className="text-sm text-[hsl(var(--ctp-subtext0))] max-w-md">
              {eligibilityMessage || 'Koordinator belum membuka periode. Silakan tunggu pengumuman.'}
            </p>
          </CardContent>
        </Card>
      ) : unenrolledEligibilities.length === 0 && activeEnrollments.length > 0 ? (
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--ctp-green))] mb-4" />
            <h2 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-2">Semua Track Sudah Dipilih</h2>
            <p className="text-sm text-[hsl(var(--ctp-subtext0))]">
              Tidak ada track tambahan yang tersedia.
            </p>
            <Button
              onClick={() => router.push('/dashboard/mahasiswa')}
              className="mt-4 rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-lavender)/0.35)]"
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
            <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">
                  Jalur {jalur === 'rpl' ? 'RPL' : 'Regular'}
                </p>
                <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                  {eligibilityMessage || (jalur === 'rpl'
                    ? 'Anda dapat memilih track mana pun yang sedang dibuka koordinator.'
                    : 'Pilihan track mengikuti semester berjalan dan periode yang dibuka koordinator.')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {jalur === 'regular' && semester ? (
                  <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
                    Semester {semester}
                  </Badge>
                ) : null}
                {repeatInfo.repeat_required && repeatInfo.repeat_track ? (
                  <Badge className="rounded-xl border border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))]">
                    Wajib Ulang {API_TRACK_LABELS[repeatInfo.repeat_track] || repeatInfo.repeat_track}
                  </Badge>
                ) : null}
                {!repeatInfo.repeat_required && repeatInfo.next_allowed_track ? (
                  <Badge className="rounded-xl border border-[hsl(var(--ctp-blue)/0.35)] bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))]">
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
              const color = typeConf.color;

              return (
                <Card
                  key={elig.track}
                  className={`cursor-pointer transition-all bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring hover:bg-[hsl(var(--ctp-surface0)/0.70)] ${isSelected ? `ring-2 ring-[hsl(var(--${color}))]` : ''}`}
                  onClick={() => setSelectedTrack(elig.track)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[hsl(var(--${color})/0.35)] bg-[hsl(var(--${color})/0.12)]`}>
                        <Icon className={`h-6 w-6 text-[hsl(var(--${color}))]`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-[hsl(var(--ctp-text))]">
                          {API_TRACK_LABELS[elig.track] || elig.track}
                        </h3>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))] mt-1">
                          {elig.reason || track?.desc || ''}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge className={`rounded-xl text-[10px] border border-[hsl(var(--${color})/0.35)] bg-[hsl(var(--${color})/0.12)] text-[hsl(var(--${color}))]`}>
                            {typeConf.label}
                          </Badge>
                          {elig.is_rpl_fallback && (
                            <Badge className="rounded-xl text-[10px] border border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] text-[hsl(var(--ctp-peach))]">
                              Via RPL
                            </Badge>
                          )}
                          {elig.jadwal_nama && (
                            <Badge className="rounded-xl text-[10px] border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
                              {elig.jadwal_nama}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className={`h-5 w-5 text-[hsl(var(--${color}))]`} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedTrack && (() => {
            const track = TRACKS.find((t) => t.apiId === selectedTrack);
            const elig = unenrolledEligibilities.find((e) => e.track === selectedTrack);
            const typeConf = ENROLLMENT_TYPE_CONFIG[elig?.enrollment_type] || ENROLLMENT_TYPE_CONFIG.regular;

            return (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
                      Konfirmasi: {API_TRACK_LABELS[selectedTrack] || selectedTrack}
                      <Badge className={`rounded-xl text-[10px] border border-[hsl(var(--${typeConf.color})/0.35)] bg-[hsl(var(--${typeConf.color})/0.12)] text-[hsl(var(--${typeConf.color}))]`}>
                        {typeConf.label}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
                      {track?.type === 'proyek'
                        ? 'Proyek dikerjakan 2 orang per kelompok.'
                        : 'Internship dilakukan secara individual.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {track?.type === 'proyek' ? (
                      <div className="space-y-2">
                        <Label className="text-[hsl(var(--ctp-subtext1))]">NPM Partner (opsional)</Label>
                        <Input
                          placeholder="Masukkan NPM partner"
                          value={partnerNpm}
                          onChange={(e) => setPartnerNpm(e.target.value)}
                          className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]"
                        />
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                          Jika diisi, kelompok otomatis terbentuk saat partner mendaftar dengan NPM Anda.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-[hsl(var(--ctp-subtext1))]">Nama Perusahaan *</Label>
                          <Input
                            placeholder="PT. Contoh Indonesia"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[hsl(var(--ctp-subtext1))]">Alamat Perusahaan</Label>
                          <Input
                            placeholder="Alamat lengkap"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedTrack(null)}
                        className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]"
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]"
                      >
                        {submitting ? 'Memproses...' : 'Konfirmasi Pilihan'}
                        <ChevronRight className="h-4 w-4 ml-1" />
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
