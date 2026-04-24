'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Plus, Edit, Trash2, CheckCircle2, Clock, XCircle, AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

const MAX_SESSIONS = 8;
const STATUS_MAP = {
  approved: { label: 'Disetujui', color: 'ctp-green', Icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'ctp-yellow', Icon: Clock },
  rejected: { label: 'Revisi', color: 'ctp-red', Icon: XCircle },
};

export default function BimbinganPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [hasPembimbing, setHasPembimbing] = useState(false);
  const [dosenNama, setDosenNama] = useState('');
  const [trackName, setTrackName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [form, setForm] = useState({ date: '', topic: '', notes: '' });

  useEffect(() => {
    if (role && role !== 'mahasiswa') { router.replace(`/dashboard/${role}`); return; }
    loadAll();
  }, [role]);

  const loadAll = async () => {
    try {
      const profileRes = await mahasiswaAPI.getProfile();
      if (profileRes.ok) {
        const p = profileRes.data;
        setTrackName(p.track || '');
        setDosenNama(p.dosen_nama || '');
        setHasPembimbing(p.status_proposal === 'approved' && !!p.dosen_nama);
      }
      const bimRes = await mahasiswaAPI.getMyBimbingan();
      if (bimRes.ok && bimRes.data) {
        setSessions(bimRes.data.map(b => ({
          id: b.id, date: b.tanggal, topic: b.topik || b.kegiatan || '',
          notes: b.catatan || '', mingguKe: b.minggu_ke, status: b.status || 'pending',
        })));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    if (!hasPembimbing) { toast.warning('Upload proposal dan dapatkan dosen pembimbing terlebih dahulu.'); return; }
    if (sessions.length >= MAX_SESSIONS) { toast.info('Bimbingan sudah mencapai 8 sesi.'); return; }
    setEditIdx(-1);
    setForm({ date: new Date().toISOString().split('T')[0], topic: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (i) => {
    setEditIdx(i);
    setForm({ date: sessions[i].date, topic: sessions[i].topic, notes: sessions[i].notes });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.date || !form.topic || !form.notes) { toast.error('Semua field wajib diisi'); return; }
    try {
      const res = await mahasiswaAPI.createBimbingan({
        tanggal: form.date, minggu_ke: sessions.length + 1, topik: form.topic, catatan: form.notes,
      });
      if (res.ok) { toast.success('Bimbingan berhasil disimpan'); setShowModal(false); loadAll(); }
      else toast.error(res.error || 'Gagal menyimpan');
    } catch { toast.error('Kesalahan jaringan'); }
  };

  const progress = (sessions.length / MAX_SESSIONS) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Track Aktif</p>
            <p className="text-base font-semibold text-[hsl(var(--ctp-text))] mt-1">{trackName || 'Belum dipilih'}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Dosen Pembimbing</p>
            <p className="text-base font-semibold text-[hsl(var(--ctp-text))] mt-1">
              {hasPembimbing ? dosenNama : <span className="text-[hsl(var(--ctp-peach))]">Belum ada</span>}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Progress Bimbingan</p>
              <span className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{sessions.length}/{MAX_SESSIONS}</span>
            </div>
            <Progress value={progress} className="mt-2" />
            <div className="flex gap-1 mt-2">
              {Array.from({ length: MAX_SESSIONS }, (_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < sessions.length ? 'bg-[hsl(var(--ctp-lavender))]' : 'bg-[hsl(var(--ctp-surface1))]'}`} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions list */}
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <MessageSquare className="h-4 w-4" /> Catatan Bimbingan
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Riwayat sesi bimbingan Anda.</CardDescription>
          </div>
          <Button onClick={openAdd} disabled={sessions.length >= MAX_SESSIONS} className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-green)/0.30)] border border-[hsl(var(--ctp-green)/0.35)]">
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </Button>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada catatan bimbingan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s, i) => {
                const st = STATUS_MAP[s.status] || STATUS_MAP.pending;
                return (
                  <div key={s.id || i} className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                    <div className={`h-9 w-9 shrink-0 rounded-full bg-[hsl(var(--${st.color})/0.20)] text-[hsl(var(--${st.color}))] flex items-center justify-center text-sm font-bold`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-[hsl(var(--ctp-subtext0))]">{s.date}</span>
                        <Badge className={`rounded-xl text-[10px] border border-[hsl(var(--${st.color})/0.35)] bg-[hsl(var(--${st.color})/0.12)] text-[hsl(var(--${st.color}))]`}>
                          {st.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-[hsl(var(--ctp-text))] truncate">{s.topic}</p>
                      <p className="text-xs text-[hsl(var(--ctp-subtext0))] mt-1 line-clamp-2">{s.notes}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(i)} className="shrink-0 h-8 w-8 text-[hsl(var(--ctp-subtext0))] hover:text-[hsl(var(--ctp-lavender))]">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <DashboardDialog open={showModal} onOpenChange={setShowModal}>
        <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-4">
          {editIdx >= 0 ? `Edit Bimbingan ke-${editIdx + 1}` : `Tambah Bimbingan ke-${sessions.length + 1}`}
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Tanggal</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
          </div>
          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Topik / Kegiatan</Label>
            <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Topik pembahasan" className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
          </div>
          <div>
            <Label className="text-[hsl(var(--ctp-subtext1))]">Catatan</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan bimbingan" rows={3} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
            Batal
          </Button>
          <Button onClick={handleSubmit} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]">
            Simpan
          </Button>
        </div>
      </DashboardDialog>
    </motion.div>
  );
}
