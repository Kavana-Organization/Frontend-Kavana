'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Plus, AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react';
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

const TRACK_LABELS = {
  proyek1: 'Proyek 1',
  proyek2: 'Proyek 2',
  proyek3: 'Proyek 3',
  'proyek-1': 'Proyek 1',
  'proyek-2': 'Proyek 2',
  'proyek-3': 'Proyek 3',
};

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function KelompokPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [userTrack, setUserTrack] = useState(null);
  const [myKelompok, setMyKelompok] = useState(null);
  const [members, setMembers] = useState([]);
  const [available, setAvailable] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (role && role !== 'mahasiswa') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileRes = await mahasiswaAPI.getProfile();
      const p = (profileRes.data?.data && typeof profileRes.data.data === 'object')
        ? profileRes.data.data
        : (profileRes.data || {});
      const track = p.track;
      if (track) setUserTrack(track);

      if (!track) {
        setLoading(false);
        return;
      }
      if (String(track).startsWith('internship')) {
        setLoading(false);
        return;
      }

      const kelRes = await mahasiswaAPI.getMyKelompok();
      const kData = (kelRes.data?.data && typeof kelRes.data.data === 'object')
        ? kelRes.data.data
        : (kelRes.data || {});
      if (kelRes.ok && kData?.kelompok) {
        setMyKelompok(kData.kelompok);
        setMembers(kData.anggota || []);
      } else {
        const availRes = await mahasiswaAPI.getAvailableKelompok();
        const aData = (availRes.data?.data && Array.isArray(availRes.data.data))
          ? availRes.data.data
          : (Array.isArray(availRes.data) ? availRes.data : []);
        if (availRes.ok) setAvailable(aData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.warning('Nama kelompok wajib diisi');
      return;
    }
    setCreating(true);
    try {
      const res = await mahasiswaAPI.createKelompok(newName.trim());
      if (res.ok) {
        toast.success('Kelompok berhasil dibuat!');
        setNewName('');
        loadData();
      } else {
        toast.error(res.error || 'Gagal membuat kelompok');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      const res = await mahasiswaAPI.joinKelompok(id);
      if (res.ok) {
        toast.success('Berhasil bergabung ke kelompok!');
        loadData();
      } else {
        toast.error(res.error || 'Gagal bergabung');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat data kelompok" />;
  }

  // No track selected
  if (!userTrack) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <PageHeader
          title="Kelompok Proyek"
          subtitle="Bentuk atau bergabung dengan kelompok proyek untuk semester aktif."
        />
        <EmptyState
          icon={AlertTriangle}
          title="Track Belum Dipilih"
          description="Pilih track terlebih dahulu sebelum membuat atau bergabung ke kelompok proyek."
          action={
            <Button onClick={() => router.push('/dashboard/mahasiswa/track')} className="min-h-[44px]">
              Pilih Track
            </Button>
          }
        />
      </motion.div>
    );
  }

  // Internship track
  if (userTrack.startsWith('internship')) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <PageHeader
          title="Kelompok Proyek"
          subtitle="Informasi keikutsertaan kelompok akademik."
        />
        <EmptyState
          icon={Users}
          title="Track Internship (Individu)"
          description="Internship dilakukan secara individual di perusahaan mitra. Anda tidak perlu membentuk atau bergabung ke kelompok proyek."
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Kelompok Proyek"
        subtitle="Kelola tim kelompok proyek atau bergabung dengan kelompok yang masih memerlukan anggota."
      />

      {/* My Kelompok Section */}
      <Card variant="muted">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                <Users className="h-4 w-4" /> Kelompok Saya
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                Track: {TRACK_LABELS[userTrack] || userTrack}
              </CardDescription>
            </div>
            {myKelompok && (
              <Badge variant="outline">
                {TRACK_LABELS[myKelompok.track] || myKelompok.track}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {myKelompok ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base text-[var(--text-strong)] break-words">
                    {myKelompok.nama}
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                    Anggota {members.length}/2
                  </span>
                </div>

                <div className="space-y-2.5">
                  {members.map((m, i) => (
                    <div
                      key={m.id || i}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] flex items-center gap-3 p-3"
                    >
                      <div className="h-9 w-9 rounded-md bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-strong)] flex items-center justify-center text-xs font-semibold">
                        {getInitials(m.nama)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-strong)] truncate">
                          {m.nama}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                          {m.npm}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {members.length < 2 ? (
                  <p className="text-xs text-[hsl(var(--ctp-peach))] mt-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Menunggu 1 anggota rekan kelompok lagi.</span>
                  </p>
                ) : (
                  <p className="text-xs text-[hsl(var(--ctp-green))] mt-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Kelompok sudah lengkap (2/2 anggota).</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Belum tergabung dalam kelompok"
              description="Buat kelompok baru di bawah atau bergabung ke kelompok yang masih membuka slot anggota."
            />
          )}
        </CardContent>
      </Card>

      {!myKelompok && (
        <>
          {/* Create Group */}
          <Card variant="muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                <Plus className="h-4 w-4" /> Buat Kelompok Baru
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                Bentuk kelompok proyek baru dan undang rekan Anda untuk bergabung.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field
                label="Nama kelompok"
                required
                hint="Masukkan nama kelompok proyek untuk memulai tim baru."
              >
                {(a11y) => (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      {...a11y}
                      placeholder="Nama kelompok"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px] flex-1"
                    />
                    <Button
                      onClick={handleCreate}
                      disabled={creating}
                      className="min-h-[44px] shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      <span>{creating ? 'Membuat...' : 'Buat Kelompok'}</span>
                    </Button>
                  </div>
                )}
              </Field>
            </CardContent>
          </Card>

          {/* Available Groups */}
          <Card variant="muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                <UserPlus className="h-4 w-4" /> Kelompok Tersedia
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                Daftar kelompok proyek yang masih membutuhkan anggota.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {available.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Tidak ada kelompok tersedia"
                  description="Belum ada kelompok lain yang membuka pendaftaran anggota pada track ini."
                />
              ) : (
                <div className="space-y-3">
                  {available.map((k) => (
                    <div
                      key={k.id}
                      className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] flex items-center justify-between gap-3 p-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--surface-raised)] border border-[var(--line)] text-[var(--text-strong)] flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-strong)] truncate">
                            {k.nama}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                            {k.jumlah_anggota}/2 anggota · {TRACK_LABELS[k.track] || k.track}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoin(k.id)}
                        size="sm"
                        className="min-h-[44px] shrink-0"
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" /> Gabung
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
