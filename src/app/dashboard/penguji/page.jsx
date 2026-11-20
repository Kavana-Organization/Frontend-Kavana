'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarClock, Clock3, GraduationCap, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState, ErrorState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { pengujiAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';
import { formatAcademicDate } from '@/lib/status-tone';

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeId(value) {
  const id = String(value ?? '').trim();
  return id || null;
}

function getProfileIds(profile) {
  return [profile?.id, profile?.dosen_id, profile?.user_id]
    .map(normalizeId)
    .filter(Boolean);
}

function isMySidang(item, profile) {
  const profileIds = getProfileIds(profile);
  const pengujiId = normalizeId(item?.penguji_id);
  if (profileIds.length > 0 && pengujiId) {
    return profileIds.includes(pengujiId);
  }

  const profileName = normalizeText(profile?.nama);
  const pengujiName = normalizeText(item?.penguji_nama || item?.nama_penguji);
  if (profileName && pengujiName) return profileName === pengujiName;

  return true;
}

function getSidangBadgeProps(item) {
  if (item?.hasil_sidang) {
    if (item.hasil_sidang === 'lulus_revisi') {
      return { status: 'lulus_revisi', label: 'Revisi' };
    }
    if (item.hasil_sidang === 'tidak_lulus') {
      return { status: 'tidak_lulus', label: 'Ditolak' };
    }
    return { status: 'completed', label: 'Selesai' };
  }
  const raw = normalizeText(item?.status);
  if (raw === 'completed') return { status: 'completed', label: 'Selesai' };
  if (raw === 'ongoing') return { status: 'pending', label: 'Menunggu' };
  return { status: 'terjadwal', label: 'Terjadwal' };
}

export default function PengujiDashboardPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidang, setSidang] = useState([]);
  const [, setProfile] = useState(null);
  const [sidangError, setSidangError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, sidangRes] = await Promise.all([
        pengujiAPI.getProfile().catch(() => ({ ok: false })),
        pengujiAPI.getSidangList().catch(() => ({ ok: false })),
      ]);
      const nextProfile = profileRes?.ok ? profileRes.data : null;
      setProfile(nextProfile);
      if (sidangRes?.ok) {
        const rows = Array.isArray(sidangRes.data) ? sidangRes.data : sidangRes.data?.data || [];
        setSidang(rows.filter((item) => isMySidang(item, nextProfile)));
        setSidangError(false);
      } else {
        setSidangError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role && role !== 'penguji') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [loadData, role, router]);

  const stats = useMemo(() => {
    const total = sidang.length;
    const pending = sidang.filter((item) => String(item?.status || '').toLowerCase() !== 'completed').length;
    const revisi = sidang.filter((item) => item?.hasil_sidang === 'lulus_revisi').length;
    const completed = sidang.filter((item) => String(item?.status || '').toLowerCase() === 'completed').length;
    return { total, pending, revisi, completed };
  }, [sidang]);

  const orderedSidang = useMemo(() => {
    return [...sidang].sort((a, b) => {
      const aDone = normalizeText(a?.status) === 'completed' ? 1 : 0;
      const bDone = normalizeText(b?.status) === 'completed' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return String(a?.tanggal || '').localeCompare(String(b?.tanggal || ''));
    });
  }, [sidang]);

  const nextActiveSidang = useMemo(
    () => orderedSidang.find((item) => normalizeText(item?.status) !== 'completed') || orderedSidang[0] || null,
    [orderedSidang]
  );

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard penguji" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard Penguji · ${TITLE_MAP.dashboard || 'Ringkasan Kegiatan'}`}
        subtitle="Layar fokus penguji: jadwal sidang hari ini/terdekat dan akses langsung ke form penilaian sidang."
      >
        <Button asChild size="sm">
          <Link href="/dashboard/penguji/sidang">
            <GraduationCap className="h-4 w-4" />
            <span>Buka Sidang</span>
          </Link>
        </Button>
      </PageHeader>

      {/* DB-5: Focus Spotlight Card — Jadwal Sidang Hari Ini / Terdekat & Direct Form Entry */}
      <Card
        data-testid="penguji-focus-spotlight"
        data-source="pengujiAPI.getSidangList"
        className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 sm:p-6"
      >
        {nextActiveSidang ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  Fokus Penilaian Sidang Terdekat
                </span>
                <StatusBadge {...getSidangBadgeProps(nextActiveSidang)} />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-strong)] break-words">
                {nextActiveSidang.display_nama || nextActiveSidang.mahasiswa_nama || '-'}
              </h2>
              <p className="text-sm text-[var(--text-body)] break-words">
                {nextActiveSidang.judul_proyek || 'Judul proyek belum tercantum'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-xs tabular-nums text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  {formatAcademicDate(nextActiveSidang.tanggal)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5 shrink-0" />
                  {nextActiveSidang.waktu ? `${String(nextActiveSidang.waktu).slice(0, 5)} WIB` : '-'}
                </span>
                <span className="inline-flex items-center gap-1 font-sans">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {nextActiveSidang.ruangan || '-'}
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/dashboard/penguji/sidang">
                  <span>Isi Form Penilaian</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Jadwal Sidang Hari Ini
              </p>
              <h2 className="mt-1 text-base font-semibold text-[var(--text-strong)]">
                Belum ada sesi sidang aktif yang menunggu penilaian
              </h2>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                Sesi sidang baru akan langsung tampil di sini begitu dijadwalkan oleh koordinator prodi.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/dashboard/penguji/sidang">Buka Halaman Sidang</Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Bordered Metric Strip (no icon tiles, tabular-nums) */}
      <div
        data-source="pengujiAPI.getSidangList"
        className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden"
      >
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total sidang</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {stats.total}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Sidang yang melibatkan Anda</p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Perlu hasil</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
            {stats.pending}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Menunggu keputusan penguji</p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Revisi</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-blue))] font-mono tabular-nums">
            {stats.revisi}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Mahasiswa perlu revisi</p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Selesai</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {stats.completed}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Hasil sudah ditentukan</p>
        </div>
      </div>

      <Card variant="muted" data-source="pengujiAPI.getSidangList">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <span>Sidang Penguji</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Tentukan hasil sidang: lulus (Selesai), lulus dengan revisi (Revisi), atau tidak lulus (Ditolak).
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
            <Link href="/dashboard/penguji/sidang">
              <span>Kelola Penilaian</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sidangError ? (
            <ErrorState
              title="Jadwal sidang penguji gagal dimuat"
              description="Gagal mengambil daftar jadwal sidang dari server."
              onRetry={loadData}
            />
          ) : orderedSidang.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada sidang untuk akun penguji ini"
              description="Jadwal sidang yang melibatkan Anda sebagai penguji akan tampil di sini."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa / Kelompok</TableHead>
                  <TableHead className="w-[120px]">NPM</TableHead>
                  <TableHead>Judul Proyek</TableHead>
                  <TableHead className="w-[150px]">Jadwal</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedSidang.slice(0, 6).map((item) => {
                  const badgeProps = getSidangBadgeProps(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell data-label="Mahasiswa" className="whitespace-normal break-words font-medium text-[var(--text-strong)]">
                        {item.display_nama || item.mahasiswa_nama || '-'}
                      </TableCell>
                      <TableCell data-label="NPM" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {item.display_npm || item.npm || '-'}
                      </TableCell>
                      <TableCell data-label="Judul Proyek" className="whitespace-normal break-words text-sm text-[var(--text-body)] max-w-md">
                        {item.judul_proyek || '-'}
                      </TableCell>
                      <TableCell data-label="Jadwal" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {formatAcademicDate(item.tanggal)}
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge {...badgeProps} />
                      </TableCell>
                      <TableCell data-label="Aksi" className="sm:text-right">
                        <Button asChild variant="outline" size="xs">
                          <Link href="/dashboard/penguji/sidang">Nilai Sidang</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
