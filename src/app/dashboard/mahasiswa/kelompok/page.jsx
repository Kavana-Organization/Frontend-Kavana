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
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';

const TRACK_LABELS = {
  'proyek1': 'Proyek 1', 'proyek2': 'Proyek 2', 'proyek3': 'Proyek 3',
  'proyek-1': 'Proyek 1', 'proyek-2': 'Proyek 2', 'proyek-3': 'Proyek 3',
};

function getInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function KelompokPage() {
  const router = useRouter();
  const { role, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [userTrack, setUserTrack] = useState(null);
  const [myKelompok, setMyKelompok] = useState(null);
  const [members, setMembers] = useState([]);
  const [available, setAvailable] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (role && role !== 'mahasiswa') { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [role]);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileRes = await mahasiswaAPI.getProfile();
      if (profileRes.ok) setUserTrack(profileRes.data.track);

      if (!profileRes.data?.track) { setLoading(false); return; }
      if (profileRes.data.track.startsWith('internship')) { setLoading(false); return; }

      const kelRes = await mahasiswaAPI.getMyKelompok();
      if (kelRes.ok && kelRes.data?.kelompok) {
        setMyKelompok(kelRes.data.kelompok);
        setMembers(kelRes.data.anggota || []);
      } else {
        const availRes = await mahasiswaAPI.getAvailableKelompok();
        if (availRes.ok) setAvailable(Array.isArray(availRes.data) ? availRes.data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.warning('Nama kelompok wajib diisi'); return; }
    setCreating(true);
    try {
      const res = await mahasiswaAPI.createKelompok(newName);
      if (res.ok) { toast.success('Kelompok berhasil dibuat!'); loadData(); }
      else toast.error(res.error || 'Gagal membuat kelompok');
    } catch { toast.error('Kesalahan jaringan'); }
    finally { setCreating(false); }
  };

  const handleJoin = async (id) => {
    try {
      const res = await mahasiswaAPI.joinKelompok(id);
      if (res.ok) { toast.success('Berhasil bergabung!'); loadData(); }
      else toast.error(res.error || 'Gagal bergabung');
    } catch { toast.error('Kesalahan jaringan'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  // No track
  if (!userTrack) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-[hsl(var(--ctp-peach))] mb-4" />
            <h2 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-2">Track Belum Dipilih</h2>
            <p className="text-sm text-[hsl(var(--ctp-subtext0))] mb-4">Pilih track terlebih dahulu sebelum membuat kelompok.</p>
            <Button onClick={() => router.push('/dashboard/mahasiswa/track')} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-lavender)/0.35)]">
              Pilih Track
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Internship
  if (userTrack.startsWith('internship')) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Users className="h-12 w-12 text-[hsl(var(--ctp-blue))] mb-4" />
            <h2 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-2">Track Internship</h2>
            <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Internship dilakukan secara individual. Anda tidak perlu membentuk kelompok.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
      {/* My kelompok */}
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <Users className="h-4 w-4" /> Kelompok Saya
          </CardTitle>
          <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
            Track: {TRACK_LABELS[userTrack] || userTrack}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myKelompok ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[hsl(var(--ctp-lavender)/0.35)] bg-[hsl(var(--ctp-lavender)/0.08)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[hsl(var(--ctp-text))]">{myKelompok.nama}</h3>
                  <Badge className="rounded-xl bg-[hsl(var(--ctp-green)/0.15)] text-[hsl(var(--ctp-green))] border border-[hsl(var(--ctp-green)/0.3)]">
                    {TRACK_LABELS[myKelompok.track] || myKelompok.track}
                  </Badge>
                </div>
                <p className="text-sm text-[hsl(var(--ctp-subtext0))] mb-3">Anggota ({members.length}/2)</p>
                <div className="space-y-2">
                  {members.map((m, i) => (
                    <div key={m.id || i} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                      <div className="h-9 w-9 rounded-full bg-[hsl(var(--ctp-lavender)/0.25)] text-[hsl(var(--ctp-text))] flex items-center justify-center text-xs font-bold">
                        {getInitials(m.nama)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--ctp-text))]">{m.nama}</p>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{m.npm}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {members.length < 2 && (
                  <p className="text-xs text-[hsl(var(--ctp-peach))] mt-3 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Menunggu 1 anggota lagi
                  </p>
                )}
                {members.length >= 2 && (
                  <p className="text-xs text-[hsl(var(--ctp-green))] mt-3 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Kelompok sudah lengkap!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum tergabung dalam kelompok</p>
              <p className="text-xs text-[hsl(var(--ctp-subtext0))] mt-1">Buat baru atau gabung ke kelompok yang tersedia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {!myKelompok && (
        <>
          {/* Create */}
          <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
                <Plus className="h-4 w-4" /> Buat Kelompok Baru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Nama kelompok"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]"
                />
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="rounded-2xl shrink-0 bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-green)/0.30)] border border-[hsl(var(--ctp-green)/0.35)]"
                >
                  <Plus className="h-4 w-4 mr-1" /> {creating ? 'Membuat...' : 'Buat'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available */}
          <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
                <UserPlus className="h-4 w-4" /> Kelompok Tersedia
              </CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
                Kelompok yang masih memerlukan anggota
              </CardDescription>
            </CardHeader>
            <CardContent>
              {available.length === 0 ? (
                <div className="text-center py-6">
                  <Search className="h-8 w-8 mx-auto text-[hsl(var(--ctp-overlay1))] mb-2" />
                  <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada kelompok tersedia</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {available.map((k) => (
                    <div key={k.id} className="flex items-center justify-between rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[hsl(var(--ctp-blue)/0.15)] text-[hsl(var(--ctp-blue))] flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--ctp-text))]">{k.nama}</p>
                          <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{k.jumlah_anggota}/2 anggota · {TRACK_LABELS[k.track] || k.track}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoin(k.id)}
                        size="sm"
                        className="rounded-2xl bg-[hsl(var(--ctp-blue)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-blue)/0.30)] border border-[hsl(var(--ctp-blue)/0.35)]"
                      >
                        <UserPlus className="h-4 w-4 mr-1" /> Gabung
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
