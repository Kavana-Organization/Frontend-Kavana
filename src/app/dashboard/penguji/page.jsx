'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarClock, GraduationCap, Users } from 'lucide-react';
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
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { pengujiAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

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
    return { status: item.hasil_sidang };
  }
  const raw = normalizeText(item?.status);
  if (raw === 'completed') return { status: 'approved', label: 'Selesai' };
  if (raw === 'ongoing') return { status: 'pending', label: 'Berlangsung' };
  return { status: 'terjadwal', label: 'Terjadwal' };
}

export default function PengujiDashboardPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidang, setSidang] = useState([]);
  const [, setProfile] = useState(null);

  useEffect(() => {
    if (role && role !== 'penguji') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const [profileRes, sidangRes] = await Promise.all([
        pengujiAPI.getProfile(),
        pengujiAPI.getSidangList(),
      ]);
      const nextProfile = profileRes.ok ? profileRes.data : null;
      setProfile(nextProfile);
      if (sidangRes.ok) {
        const rows = Array.isArray(sidangRes.data) ? sidangRes.data : sidangRes.data?.data || [];
        setSidang(rows.filter((item) => isMySidang(item, nextProfile)));
      }
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard penguji" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard Penguji · ${TITLE_MAP.dashboard || 'Ringkasan Kegiatan'}`}
        subtitle="Pantau jadwal sidang yang ditugaskan dan tetapkan keputusan hasil sidang."
      >
        <Button asChild size="sm">
          <Link href="/dashboard/penguji/sidang">
            <GraduationCap className="h-4 w-4" />
            <span>Buka Sidang</span>
          </Link>
        </Button>
      </PageHeader>

      {/* Bordered Metric Strip (no icon tiles, tabular-nums) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
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

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <span>Sidang Penguji</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Tentukan hasil sidang: lulus, lulus dengan revisi, atau tidak lulus.
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
          {orderedSidang.length === 0 ? (
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
                  <TableHead className="w-[150px]">Status</TableHead>
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
                      <TableCell data-label="Status">
                        <StatusBadge {...badgeProps} />
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
