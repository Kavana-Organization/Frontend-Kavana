'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Building2, Users, Clock, CheckCircle2, AlertTriangle, ChevronRight,
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

const SEMESTER_TRACK_MAP = {
  2: 'proyek-1', 3: 'proyek-2', 5: 'proyek-3', 7: 'internship-1', 8: 'internship-2',
};
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

export default function TrackPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState(null);
  const [jalur, setJalur] = useState('regular');
  const [periodeActive, setPeriodeActive] = useState(false);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [repeatInfo, setRepeatInfo] = useState({ repeat_required: false, repeat_track: null, next_allowed_track: null, eligibility_source: null });
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [partnerNpm, setPartnerNpm] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAndLoad = async () => {
      try {
        const profileRes = await mahasiswaAPI.getProfile();
        if (profileRes.ok && profileRes.data?.track) {
          toast.info(`Anda sudah memilih ${API_TRACK_LABELS[profileRes.data.track] || profileRes.data.track}`);
          router.replace('/dashboard/mahasiswa');
          return;
        }
        if (profileRes.ok) {
          setJalur(profileRes.data?.jalur || 'regular');
        }
        const periodeRes = await mahasiswaAPI.getPeriodeAktif();
        if (periodeRes.ok) {
          setSemester(periodeRes.data.semester);
          setPeriodeActive(!!periodeRes.data.active);
          setJalur(periodeRes.data.jalur || profileRes.data?.jalur || 'regular');
          setAvailableTracks(Array.isArray(periodeRes.data.available_tracks) ? periodeRes.data.available_tracks : []);
          setEligibilityMessage(periodeRes.data.message || '');
          setRepeatInfo({
            repeat_required: !!periodeRes.data.repeat_required,
            repeat_track: periodeRes.data.repeat_track || null,
            next_allowed_track: periodeRes.data.next_allowed_track || null,
            eligibility_source: periodeRes.data.eligibility_source || null,
          });
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

  const visibleTracks = TRACKS.filter(t => periodeActive && availableTracks.includes(t.apiId));

  const handleConfirm = async () => {
    if (!selectedTrack) return;
    const track = TRACKS.find(t => t.id === selectedTrack);
    if (!track) return;

    if (track.type === 'internship' && !companyName.trim()) {
      toast.error('Nama perusahaan wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mahasiswaAPI.setTrack(track.apiId, partnerNpm || null);
      if (res.ok) {
        toast.success(`${track.name} berhasil dipilih!`);
        if (track.type === 'proyek' && !res.data?.matched) {
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
      {visibleTracks.length === 0 ? (
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] mb-4">
              <AlertTriangle className="h-8 w-8 text-[hsl(var(--ctp-peach))]" />
            </div>
            <h2 className="text-xl font-semibold text-[hsl(var(--ctp-text))] mb-2">
              {!semester || !SEMESTER_TRACK_MAP[semester]
                ? 'Tidak Ada Proyek di Semester Ini'
                : 'Periode Proyek Belum Dibuka'}
            </h2>
            <p className="text-sm text-[hsl(var(--ctp-subtext0))] max-w-md">
              {eligibilityMessage
                ? eligibilityMessage
                : jalur === 'rpl'
                ? 'Belum ada periode proyek atau internship aktif. Silakan tunggu koordinator membuka periode.'
                : !semester || !SEMESTER_TRACK_MAP[semester]
                ? `Semester ${semester || '-'} tidak memiliki proyek atau internship.`
                : 'Koordinator belum membuka periode. Silakan tunggu pengumuman.'}
            </p>
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
                  {eligibilityMessage
                    ? eligibilityMessage
                    : jalur === 'rpl'
                    ? 'Anda dapat memilih track mana pun yang sedang dibuka koordinator.'
                    : 'Pilihan track mengikuti semester berjalan dan periode yang dibuka koordinator.'}
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
            {visibleTracks.map((track) => {
              const Icon = track.icon;
              const isSelected = selectedTrack === track.id;
              const color = track.type === 'proyek' ? 'ctp-blue' : 'ctp-mauve';
              return (
                <Card
                  key={track.id}
                  className={`cursor-pointer transition-all bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring hover:bg-[hsl(var(--ctp-surface0)/0.70)] ${isSelected ? `ring-2 ring-[hsl(var(--${color}))]` : ''}`}
                  onClick={() => setSelectedTrack(track.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[hsl(var(--${color})/0.35)] bg-[hsl(var(--${color})/0.12)]`}>
                        <Icon className={`h-6 w-6 text-[hsl(var(--${color}))]`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-[hsl(var(--ctp-text))]">{track.name}</h3>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))] mt-1">{track.desc}</p>
                        <Badge className="mt-2 rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
                          Semester {track.semester}
                        </Badge>
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

          {selectedTrack && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
                <CardHeader>
                  <CardTitle className="text-[hsl(var(--ctp-text))]">
                    Konfirmasi: {TRACK_LABELS[selectedTrack]}
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
                    {TRACKS.find(t => t.id === selectedTrack)?.type === 'proyek'
                      ? 'Proyek dikerjakan 2 orang per kelompok.'
                      : 'Internship dilakukan secara individual.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {TRACKS.find(t => t.id === selectedTrack)?.type === 'proyek' ? (
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
          )}
        </>
      )}
    </motion.div>
  );
}
