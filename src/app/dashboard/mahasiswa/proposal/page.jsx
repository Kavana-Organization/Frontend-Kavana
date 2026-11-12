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
import { Field } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';
import { getGoogleDriveLinkError } from '@/lib/validation';

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
  const [form, setForm] = useState({
    nama: '',
    npm: '',
    judul: '',
    dosen: '',
    dosen2: '',
    partnerNama: '',
    link: '',
  });

  const loadData = useCallback(async () => {
    try {
      const profileRes = await mahasiswaAPI.getProfile();
      if (profileRes.ok) {
        const p = (profileRes.data?.data && typeof profileRes.data.data === 'object')
          ? profileRes.data.data
          : (profileRes.data || {});
        setForm((f) => ({ ...f, nama: p.nama || user?.name || '', npm: p.npm || '' }));

        const activeEnrollments = Array.isArray(p.enrollments)
          ? p.enrollments.filter((e) => e.status === 'active')
          : [];
        let nextSelectedEnrollmentId = null;
        setEnrollments(activeEnrollments);

        if (activeEnrollments.length === 1) {
          const enr = activeEnrollments[0];
          nextSelectedEnrollmentId = enr.id;
          setSelectedEnrollmentId(enr.id);
          setTrack(enr.track || p.track || '');

          if (['pending', 'approved'].includes(enr.status_proposal) && enr.judul_proyek) {
            setHasProposal(true);
            setProposalStatus(enr.status_proposal);
          }
        } else if (activeEnrollments.length > 1) {
          const needsProposal = activeEnrollments.filter(
            (e) => !e.judul_proyek || e.status_proposal === 'rejected'
          );
          if (needsProposal.length === 1) {
            const enr = needsProposal[0];
            nextSelectedEnrollmentId = enr.id;
            setSelectedEnrollmentId(enr.id);
            setTrack(enr.track || '');
          } else if (needsProposal.length === 0) {
            setHasProposal(true);
            setProposalStatus('pending');
          }
        } else {
          setTrack(p.track || '');
          if (['pending', 'approved'].includes(p.status_proposal)) {
            setHasProposal(true);
            setProposalStatus(p.status_proposal);
          }
        }

        const selectedTrack =
          activeEnrollments.length > 0
            ? activeEnrollments.find((e) => sameId(e.id, nextSelectedEnrollmentId))?.track ||
              activeEnrollments[0]?.track
            : p.track;

        if (String(selectedTrack || '').includes('proyek')) {
          const kelompokRes = await mahasiswaAPI.getMyKelompok();
          const kData = (kelompokRes.data?.data && typeof kelompokRes.data.data === 'object')
            ? kelompokRes.data.data
            : (kelompokRes.data || {});
          if (kelompokRes.ok && Array.isArray(kData?.anggota)) {
            setKelompokMembers(kData.anggota);
          } else {
            setKelompokMembers([]);
          }
        } else {
          setKelompokMembers([]);
        }
      }
      const dosenRes = await mahasiswaAPI.getDosenList();
      if (dosenRes.ok) {
        const dData = (dosenRes.data?.data && Array.isArray(dosenRes.data.data))
          ? dosenRes.data.data
          : (Array.isArray(dosenRes.data) ? dosenRes.data : []);
        setDosenList(dData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.name]);

  useEffect(() => {
    if (role && role !== 'mahasiswa') {
      router.replace(`/dashboard/${role}`);
      return;
    }
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
    if (!form.judul.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }
    if (!form.dosen) {
      toast.error('Pilih dosen pembimbing');
      return;
    }
    if (!form.link.trim()) {
      toast.error('Link proposal wajib diisi');
      return;
    }
    const proposalLinkError = getGoogleDriveLinkError(form.link, 'Link proposal');
    if (proposalLinkError) {
      toast.error(proposalLinkError);
      return;
    }

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
      if (res.ok) {
        toast.success('Proposal berhasil disubmit!');
        router.push('/dashboard/mahasiswa');
      } else {
        toast.error(res.error || 'Gagal submit');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState variant="form" label="Memuat formulir proposal" />;
  }

  if (!track && enrollments.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <PageHeader
          title="Upload Proposal"
          subtitle="Ajukan berkas proposal proyek atau internship untuk validasi koordinator prodi."
        />
        <EmptyState
          icon={AlertTriangle}
          title="Track Belum Dipilih"
          description="Pilih track terlebih dahulu sebelum mengunggah proposal proyek atau internship."
          action={
            <Button onClick={() => router.push('/dashboard/mahasiswa/track')} className="min-h-[44px]">
              Pilih Track
            </Button>
          }
        />
      </motion.div>
    );
  }

  if (hasProposal) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <PageHeader
          title="Upload Proposal"
          subtitle="Status pengajuan proposal proyek atau internship Anda."
        />
        <Card variant="muted">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--ctp-green))] mb-3" />
            <h2 className="text-lg font-semibold text-[var(--text-strong)] mb-1">
              Proposal Sudah Disubmit
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Proposal Anda saat ini dalam status verifikasi koordinator program studi.
            </p>
            <StatusBadge status={proposalStatus} />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Multi-enrollment selector
  const needsEnrollmentSelector = enrollments.length > 1 && !selectedEnrollmentId;

  if (needsEnrollmentSelector) {
    const unsubmitted = enrollments.filter(
      (e) => !e.judul_proyek || e.status_proposal === 'rejected'
    );
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <PageHeader
          title="Upload Proposal"
          subtitle="Pilih enrollment aktif yang akan diajukan proposal."
        />
        <Card variant="muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Layers className="h-4 w-4" /> Pilih Enrollment Aktif
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Anda memiliki beberapa enrollment aktif. Pilih track mana yang ingin Anda ajukan proposalnya.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unsubmitted.map((enr) => (
              <div
                key={enr.id}
                onClick={() => handleEnrollmentSelect(enr.id)}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] cursor-pointer p-4 transition-all hover:bg-[var(--surface-sunken)]/80 flex items-center justify-between gap-3"
              >
                <span className="text-sm font-semibold text-[var(--text-strong)]">
                  {API_TRACK_LABELS[enr.track] || enr.track}
                </span>
                <Badge variant="outline">
                  {ENROLLMENT_TYPE_LABELS[enr.enrollment_type] || enr.enrollment_type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const isProyek = String(track || '').includes('proyek');
  const isInternship = String(track || '').includes('internship');
  const anggotaProposal =
    isProyek && kelompokMembers.length > 0
      ? kelompokMembers
      : [{ nama: form.nama, npm: form.npm }];

  const selectedEnrollment = enrollments.find((e) => e.id === selectedEnrollmentId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Upload Proposal"
        subtitle="Ajukan proposal proyek atau internship Anda untuk ditinjau oleh koordinator program studi."
      />

      <Card variant="muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <Upload className="h-4 w-4" /> Formulir Proposal
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
            <span>Track: {API_TRACK_LABELS[track] || track}</span>
            {selectedEnrollment && selectedEnrollment.enrollment_type !== 'regular' && (
              <Badge variant="outline" className="text-xs">
                {ENROLLMENT_TYPE_LABELS[selectedEnrollment.enrollment_type] ||
                  selectedEnrollment.enrollment_type}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="proposal-form" onSubmit={handleSubmit} className="space-y-4">
            {anggotaProposal.map((anggota, index) => (
              <div
                key={`${anggota.npm || anggota.nama || 'anggota'}-${index}`}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <Field label={isProyek ? `Nama Anggota ${index + 1}` : 'Nama'}>
                  <Input
                    value={anggota.nama || ''}
                    readOnly
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
                  />
                </Field>
                <Field label={isProyek ? `NPM Anggota ${index + 1}` : 'NPM'}>
                  <Input
                    value={anggota.npm || ''}
                    readOnly
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
                  />
                </Field>
              </div>
            ))}

            {isProyek && (
              <p className="text-xs text-[var(--text-muted)]">
                Untuk track proyek, proposal cukup disubmit satu kali oleh salah satu anggota kelompok dan otomatis berlaku untuk seluruh anggota.
              </p>
            )}

            <Field label="Judul" required>
              <Input
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Judul proposal"
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
              />
            </Field>

            <div className={`grid grid-cols-1 gap-4 ${isInternship ? 'md:grid-cols-2' : ''}`}>
              <Field label="Dosen 1" required>
                {(a11y) => (
                  <Select
                    value={form.dosen}
                    onValueChange={(value) => setForm({ ...form, dosen: value })}
                  >
                    <SelectTrigger
                      id={a11y.id}
                      aria-describedby={a11y['aria-describedby']}
                      className="w-full min-h-[44px] bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                    >
                      <SelectValue placeholder="-- Pilih Dosen 1 --" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                      {dosenList.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>

              {isInternship && (
                <Field label="Dosen 2" required>
                  {(a11y) => (
                    <Select
                      value={form.dosen2}
                      onValueChange={(value) => setForm({ ...form, dosen2: value })}
                    >
                      <SelectTrigger
                        id={a11y.id}
                        aria-describedby={a11y['aria-describedby']}
                        className="w-full min-h-[44px] bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                      >
                        <SelectValue placeholder="-- Pilih Dosen 2 --" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                        {dosenList.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
              )}
            </div>

            <Field label="Link Proposal" required>
              <Input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://drive.google.com/drive/..."
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
              />
            </Field>

            <div className="flex gap-3 pt-3 border-t border-[var(--line)]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard/mahasiswa')}
                className="min-h-[44px]"
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="min-h-[44px]">
                <Upload className="h-4 w-4 mr-1.5" />
                <span>{submitting ? 'Mengirim...' : 'Submit Proposal'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
