'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
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
import { kaprodiAPI } from '@/lib/api';

function getMahasiswaCount(d) {
  const raw = d?.mahasiswa_count ?? d?.jumlah_bimbingan ?? 0;
  const count = Number(raw);
  return Number.isFinite(count) ? count : 0;
}

export default function DaftarDosenPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (role && role !== 'kaprodi') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const res = (await kaprodiAPI.getDosenList?.()) || { ok: true, data: [] };
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = list.filter(
    (d) => !search || (d.nama || '').toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = list.filter((d) => getMahasiswaCount(d) > 0).length;

  if (loading) {
    return <LoadingState variant="table" label="Memuat rekap dosen pembimbing" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap & Daftar Dosen Pembimbing"
        subtitle="Pantau sebaran dosen pembimbing serta beban mahasiswa bimbingan di program studi."
      />

      {/* Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Dosen</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {list.length}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Aktif Membimbing</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {activeCount}
          </p>
        </div>
      </div>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Users className="h-4 w-4 shrink-0" />
              <span>Rekap Beban Dosen</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Monitoring jumlah mahasiswa bimbingan aktif per dosen.
            </CardDescription>
          </div>
          <div className="w-full sm:w-64">
            <Field label="Cari dosen">
              {(a11y) => (
                <Input
                  {...a11y}
                  name="search"
                  placeholder="Nama dosen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada data dosen untuk dipantau"
              description="Data dosen pembimbing program studi akan tampil di sini setelah terdaftar atau sesuai kata kunci pencarian."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dosen</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[150px]">Beban Bimbingan</TableHead>
                  <TableHead className="w-[160px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d, i) => {
                  const count = getMahasiswaCount(d);
                  return (
                    <TableRow key={d.id || i}>
                      <TableCell data-label="Nama Dosen" className="whitespace-normal break-words font-medium text-[var(--text-strong)]">
                        {d.nama || '-'}
                      </TableCell>
                      <TableCell data-label="Email" className="whitespace-normal break-all text-sm text-[var(--text-muted)]">
                        {d.email || '-'}
                      </TableCell>
                      <TableCell data-label="Beban Bimbingan" className="font-mono text-xs tabular-nums text-[var(--text-body)]">
                        {count} mhs
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge
                          status={count > 0 ? 'active' : 'neutral'}
                          label={count > 0 ? 'Aktif Membimbing' : 'Belum Membimbing'}
                        />
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
