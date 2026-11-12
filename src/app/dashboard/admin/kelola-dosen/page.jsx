'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserCog } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { DashboardDialog } from '@/components/shared/dashboard-dialog';
import { useAuthStore } from '@/store/auth-store';
import { adminAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

export default function KelolaDosenPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '' });

  useEffect(() => {
    if (role && role !== 'admin') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const res = await adminAPI.getAllDosen();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.email || !form.password) {
      toast.error('Semua field wajib diisi');
      return;
    }
    try {
      const res = await adminAPI.createDosen(form);
      if (res.ok) {
        toast.success('Dosen berhasil ditambahkan!');
        setShowModal(false);
        setForm({ nama: '', email: '', password: '' });
        loadData();
      } else {
        toast.error(res.error || 'Gagal');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  const filtered = list.filter(
    (d) => !search || (d.nama || '').toLowerCase().includes(search.toLowerCase())
  );
  const activeSupervising = list.filter((d) => Number(d.jumlah_bimbingan || 0) > 0).length;
  const totalBimbingan = list.reduce((sum, d) => sum + Number(d.jumlah_bimbingan || 0), 0);

  if (loading) {
    return <LoadingState variant="table" label="Memuat data dosen" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={TITLE_MAP['kelola-dosen'] || 'Kelola Dosen'}
        subtitle="Tambah akun dosen pembimbing baru dan pantau beban bimbingan mahasiswa."
      >
        <Button type="button" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          <span>Tambah</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="bg-[var(--surface-raised)] p-4 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Dosen</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {list.length}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">Aktif Membimbing</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {activeSupervising}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Bimbingan</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-blue))] font-mono tabular-nums">
            {totalBimbingan}
          </p>
        </div>
      </div>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <UserCog className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span>Daftar Dosen</span>
          </CardTitle>
          <div className="w-full sm:w-64">
            <Field label="Cari dosen">
              {(a11y) => (
                <Input
                  {...a11y}
                  name="search"
                  placeholder="Cari nama dosen..."
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
              icon={UserCog}
              title="Tidak ada data dosen"
              description="Belum ada dosen terdaftar atau tidak ada hasil yang sesuai dengan pencarian."
              action={
                <Button type="button" variant="outline" onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Tambah Dosen</span>
                </Button>
              }
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosen</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Bimbingan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d, i) => {
                  const count = Number(d.jumlah_bimbingan || 0);
                  return (
                    <TableRow key={d.id || i}>
                      <TableCell data-label="Dosen" className="min-w-0">
                        <span className="font-medium text-[var(--text-strong)] whitespace-normal break-words">
                          {d.nama || '-'}
                        </span>
                      </TableCell>
                      <TableCell data-label="Email" className="min-w-0">
                        <span className="text-sm text-[var(--text-body)] whitespace-normal break-all">
                          {d.email || '-'}
                        </span>
                      </TableCell>
                      <TableCell data-label="Bimbingan" className="sm:text-right">
                        <StatusBadge
                          status={count > 0 ? 'active' : 'neutral'}
                          label={`${count} mhs`}
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

      <DashboardDialog
        open={showModal}
        onOpenChange={setShowModal}
        title="Tambah Dosen"
        description="Isi data akun dosen pembimbing baru."
        className="rounded-xl border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-strong)]"
      >
        <div className="mb-4 space-y-1">
          <h3 className="text-base font-semibold text-[var(--text-strong)]">Tambah Dosen</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Lengkapi identitas dan kredensial awal untuk akun dosen baru.
          </p>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Nama" required>
            {(a11y) => (
              <Input
                {...a11y}
                name="nama"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama lengkap dan gelar"
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
              />
            )}
          </Field>
          <Field label="Email" required>
            {(a11y) => (
              <Input
                {...a11y}
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@ulbi.ac.id"
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
              />
            )}
          </Field>
          <Field label="Password" required>
            {(a11y) => (
              <Input
                {...a11y}
                name="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 8 karakter"
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
              />
            )}
          </Field>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit">Tambah</Button>
          </div>
        </form>
      </DashboardDialog>
    </div>
  );
}
