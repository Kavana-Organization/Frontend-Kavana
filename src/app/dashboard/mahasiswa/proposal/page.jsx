'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { mahasiswaAPI } from '@/lib/api';
import { getGoogleDriveLinkError } from '@/lib/validation';

const API_TRACK_LABELS = {
  proyek1: 'Proyek 1', proyek2: 'Proyek 2', proyek3: 'Proyek 3',
  internship1: 'Internship 1', internship2: 'Internship 2',
};

const ENROLLMENT_TYPE_LABELS = {
  regular: 'Regular',
  repeat: 'Repeat',
  parallel_repeat: 'Paralel',
};

function sameId(left, right) {
  const leftId = String(left ?? '').trim();
  const rightId = String(right ?? '').trim();
  return Boolean(leftId && rightId && leftId === rightId);
}

export default function ProposalPage() {
  const router = useRouter();
  const { role, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dosenList, setDosenList] = useState([]);
  const [kelompokMembers, setKelompokMembers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);
  const [track, setTrack] = useState('');
  const [hasProposal, setHasProposal] = useState(false);
  const [proposalStatus, setProposalStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama: '', npm: '', judul: '', dosen: '', dosen2: '', partnerNama: '', link: '' });

  const loadData = useCallback(async () => {
    try {
      const profileRes = await mahasiswaAPI.getProfile();
      if (profileRes.ok) {
        const p = profileRes.data;
        setForm(f => ({ ...f, nama: p.nama || user?.name || '', npm: p.npm || '' }));

        // Get enrollments from profile
        const activeEnrollments = Array.isArray(p.enrollments) ? p.enrollments.filter((e) => e.status === 'active') : [];
        let nextSelectedEnrollmentId = null;
        setEnrollments(activeEnrollments);

        if (activeEnrollments.length === 1) {
          // Single enrollment: auto-select
          const enr = activeEnrollments[0];
          nextSelectedEnrollmentId = enr.id;
          setSelectedEnrollmentId(enr.id);
          setTrack(enr.track || p.track || '');

          // Check proposal status from enrollment
          if (['pending', 'approved'].includes(enr.status_proposal) && enr.judul_proyek) {
            setHasProposal(true);
            setProposalStatus(enr.status_proposal);
          }
        } else if (activeEnrollments.length > 1) {
          // Multi-enrollment: find one without proposal
          const needsProposal = activeEnrollments.filter((e) =>
            !e.judul_proyek || e.status_proposal === 'rejected'
          );
          if (needsProposal.length === 1) {
            const enr = needsProposal[0];
            nextSelectedEnrollmentId = enr.id;
            setSelectedEnrollmentId(enr.id);
            setTrack(enr.track || '');
          } else if (needsProposal.length === 0) {
            // All have proposals
            setHasProposal(true);
            setProposalStatus('pending');
          }
          // else: user must select
        } else {
          // No enrollments, fallback to legacy
          setTrack(p.track || '');
          if (['pending', 'approved'].includes(p.status_proposal)) {
            setHasProposal(true);
            setProposalStatus(p.status_proposal);
          }
        }

        // Load kelompok members
        const selectedTrack = activeEnrollments.length > 0
          ? (activeEnrollments.find((e) => sameId(e.id, nextSelectedEnrollmentId))?.track || activeEnrollments[0]?.track)
          : p.track;

        if (String(selectedTrack || '').includes('proyek')) {
          const kelompokRes = await mahasiswaAPI.getMyKelompok();
          if (kelompokRes.ok && Array.isArray(kelompokRes.data?.anggota)) {
            setKelompokMembers(kelompokRes.data.anggota);
          } else {
            setKelompokMembers([]);
          }
        } else {
          setKelompokMembers([]);
        }
      }
      const dosenRes = await mahasiswaAPI.getDosenList();
      if (dosenRes.ok) setDosenList(Array.isArray(dosenRes.data) ? dosenRes.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user?.name]);

  useEffect(() => {
    if (role && role !== 'mahasiswa') { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [loadData, role, router]);

  const handleEnrollmentSelect = (enrollmentId) => {
    const enr = enrollments.find((e) => sameId(e.id, enrollmentId));
    if (enr) {
      setSelectedEnrollmentId(enr.id);
      setTrack(enr.track || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) { toast.error('Judul wajib diisi'); return; }
    if (!form.dosen) { toast.error('Pilih dosen pembimbing'); return; }
    if (!form.link.trim()) { toast.error('Link proposal wajib diisi'); return; }
    const proposalLinkError = getGoogleDriveLinkError(form.link, 'Link proposal');
    if (proposalLinkError) { toast.error(proposalLinkError); return; }

    if (enrollments.length > 1 && !selectedEnrollmentId) {
      toast.error('Pilih enrollment terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mahasiswaAPI.submitProposal({
        judul_proyek: form.judul.trim(),
        file_url: form.link.trim(),
        usulan_dosen_id: form.dosen || null,
        dosen_id_2: form.dosen2 || null,
        partner_nama: form.partnerNama || null,
        enrollment_id: selectedEnrollmentId || null,
      });
      if (res.ok) { toast.success('Proposal berhasil disubmit!'); router.push('/dashboard/mahasiswa'); }
      else toast.error(res.error || 'Gagal submit');
    } catch { toast.error('Kesalahan jaringan'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  if (!track && enrollments.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--ctp-peach))] mb-4" />
          <h2 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-2">Track Belum Dipilih</h2>
          <Button onClick={() => router.push('/dashboard/mahasiswa/track')} className="mt-4 rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-lavender)/0.35)]">Pilih Track</Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (hasProposal) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-[hsl(var(--ctp-green))] mb-4" />
          <h2 className="text-lg font-semibold text-[hsl(var(--ctp-text))] mb-2">Proposal Sudah Disubmit</h2>
          <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Status: <span className="font-medium capitalize">{proposalStatus}</span></p>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Multi-enrollment selector
  const needsEnrollmentSelector = enrollments.length > 1 && !selectedEnrollmentId;

  if (needsEnrollmentSelector) {
    const unsubmitted = enrollments.filter((e) => !e.judul_proyek || e.status_proposal === 'rejected');
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <Layers className="h-4 w-4" /> Pilih Enrollment
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
              Anda memiliki beberapa enrollment aktif. Pilih untuk track mana proposal akan disubmit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unsubmitted.map((enr) => (
              <div
                key={enr.id}
                onClick={() => handleEnrollmentSelect(enr.id)}
                className="cursor-pointer rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-4 hover:bg-[hsl(var(--ctp-surface0)/0.5)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[hsl(var(--ctp-text))]">
                    {API_TRACK_LABELS[enr.track] || enr.track}
                  </span>
                  <Badge className="rounded-xl text-[10px] border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
                    {ENROLLMENT_TYPE_LABELS[enr.enrollment_type] || enr.enrollment_type}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const inputCls = "bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]";
  const isProyek = String(track || '').includes('proyek');
  const isInternship = String(track || '').includes('internship');
  const anggotaProposal = isProyek && kelompokMembers.length > 0
    ? kelompokMembers
    : [{ nama: form.nama, npm: form.npm }];

  const selectedEnrollment = enrollments.find((e) => e.id === selectedEnrollmentId);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <Upload className="h-4 w-4" /> Upload Proposal
          </CardTitle>
          <CardDescription className="text-[hsl(var(--ctp-subtext0))] flex items-center gap-2 flex-wrap">
            Track: {API_TRACK_LABELS[track] || track}
            {selectedEnrollment && selectedEnrollment.enrollment_type !== 'regular' && (
              <Badge className="rounded-xl text-[10px] border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
                {ENROLLMENT_TYPE_LABELS[selectedEnrollment.enrollment_type] || selectedEnrollment.enrollment_type}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {anggotaProposal.map((anggota, index) => (
              <div key={`${anggota.npm || anggota.nama || 'anggota'}-${index}`} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[hsl(var(--ctp-subtext1))]">
                    {isProyek ? `Nama Anggota ${index + 1}` : 'Nama'}
                  </Label>
                  <Input value={anggota.nama || ''} readOnly className={inputCls} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(var(--ctp-subtext1))]">
                    {isProyek ? `NPM Anggota ${index + 1}` : 'NPM'}
                  </Label>
                  <Input value={anggota.npm || ''} readOnly className={inputCls} />
                </div>
              </div>
            ))}
            {isProyek && (
              <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                Untuk track proyek, proposal cukup disubmit satu kali oleh salah satu anggota kelompok dan akan berlaku untuk seluruh anggota.
              </p>
            )}
            <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Judul *</Label><Input value={form.judul} onChange={e => setForm({...form, judul: e.target.value})} placeholder="Judul proposal" className={inputCls} /></div>
            <div className={`grid grid-cols-1 gap-4 ${isInternship ? 'md:grid-cols-2' : ''}`}>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--ctp-subtext1))]">Dosen 1 *</Label>
                <Select value={form.dosen} onValueChange={(value) => setForm({ ...form, dosen: value })}>
                  <SelectTrigger className="w-full h-10 px-3 rounded-md text-sm bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]">
                    <SelectValue placeholder="-- Pilih --" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
                    {dosenList.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)} className="text-[hsl(var(--ctp-text))] focus:bg-[hsl(var(--ctp-surface1)/0.6)] focus:text-[hsl(var(--ctp-text))]">
                        {d.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isInternship ? (
                <div className="space-y-2">
                  <Label className="text-[hsl(var(--ctp-subtext1))]">Dosen 2 *</Label>
                  <Select value={form.dosen2} onValueChange={(value) => setForm({ ...form, dosen2: value })}>
                    <SelectTrigger className="w-full h-10 px-3 rounded-md text-sm bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]">
                      <SelectValue placeholder="-- Pilih --" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-[hsl(var(--ctp-surface0))] border-[hsl(var(--ctp-overlay0)/0.45)]">
                      {dosenList.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)} className="text-[hsl(var(--ctp-text))] focus:bg-[hsl(var(--ctp-surface1)/0.6)] focus:text-[hsl(var(--ctp-text))]">
                          {d.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
            <div className="space-y-2"><Label className="text-[hsl(var(--ctp-subtext1))]">Link Proposal *</Label><Input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://drive.google.com/drive/..." className={inputCls} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => router.push('/dashboard/mahasiswa')} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">Batal</Button>
              <Button type="submit" disabled={submitting} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]">
                <Upload className="h-4 w-4 mr-1" /> {submitting ? 'Mengirim...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
