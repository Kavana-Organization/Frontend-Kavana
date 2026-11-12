'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Pencil,
  Save,
  Shield,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCog,
} from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog';
import { useAuthStore } from '@/store/auth-store';
import { adminAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

const ROLE_COLORS = {
  mahasiswa: 'ctp-blue',
  dosen: 'ctp-green',
  koordinator: 'ctp-teal',
  kaprodi: 'ctp-mauve',
  admin: 'ctp-red',
};
const JALUR_OPTIONS = ['regular', 'rpl'];

const EMPTY_FORM = {
  nama: '',
  email: '',
  no_wa: '',
  npm: '',
  nidn: '',
  angkatan: '',
  jalur: 'regular',
};

const EMPTY_PASSWORD_FORM = {
  new_password: '',
  confirm_password: '',
};

export default function KelolaUsersPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(EMPTY_FORM);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await adminAPI.getAllUsers();
      if (res.ok) {
        const data = res.data;
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([...(data.mahasiswa || []), ...(data.dosen || [])]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!role) return;
    if (role !== 'admin') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [loadData, role, router]);

  const resetDialogs = () => {
    setSelectedUser(null);
    setProfileForm(EMPTY_FORM);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setEditOpen(false);
    setPasswordOpen(false);
    setDeleteDialogOpen(false);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setProfileForm({
      nama: user.nama || '',
      email: user.email || '',
      no_wa: user.no_wa || '',
      npm: user.npm || '',
      nidn: user.nidn || '',
      angkatan: user.angkatan ? String(user.angkatan) : '',
      jalur: user.jalur || 'regular',
    });
    setEditOpen(true);
  };

  const openPasswordDialog = (user) => {
    setSelectedUser(user);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordOpen(true);
  };

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        if (filterRole !== 'all' && user.role !== filterRole) return false;
        if (!search) return true;
        const keyword = search.toLowerCase();
        return [user.nama, user.email, user.npm, user.nidn]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      }),
    [filterRole, search, users]
  );

  const roleCounts = useMemo(
    () => ({
      all: users.length,
      mahasiswa: users.filter((user) => user.role === 'mahasiswa').length,
      dosen: users.filter((user) => user.role === 'dosen').length,
      koordinator: users.filter((user) => user.role === 'koordinator').length,
      kaprodi: users.filter((user) => user.role === 'kaprodi').length,
      admin: users.filter((user) => user.role === 'admin').length,
    }),
    [users]
  );

  const handleToggle = async (user) => {
    try {
      const res = await adminAPI.updateUserStatus(user.id, user.role, user.is_active === false);
      if (!res.ok) {
        toast.error(res.error || 'Gagal mengubah status user');
        return;
      }
      toast.success(`User ${user.is_active === false ? 'diaktifkan' : 'dinonaktifkan'}`);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan jaringan');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      const res = await adminAPI.deleteUser(selectedUser.id, selectedUser.role);
      if (!res.ok) {
        toast.error(res.error || 'Gagal menghapus user');
        return;
      }
      toast.success('User berhasil dihapus');
      resetDialogs();
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    if (!profileForm.nama.trim() || !profileForm.email.trim()) {
      toast.error('Nama dan email wajib diisi');
      return;
    }
    if (selectedUser.role === 'mahasiswa' && !profileForm.npm.trim()) {
      toast.error('NPM wajib diisi');
      return;
    }
    if (selectedUser.role !== 'mahasiswa' && !profileForm.nidn.trim()) {
      toast.error('NIDN wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        role: selectedUser.role,
        nama: profileForm.nama.trim(),
        email: profileForm.email.trim(),
        no_wa: profileForm.no_wa.trim(),
      };

      if (selectedUser.role === 'mahasiswa') {
        payload.npm = profileForm.npm.trim();
        payload.angkatan = profileForm.angkatan ? Number(profileForm.angkatan) : null;
        payload.jalur = profileForm.jalur;
      } else {
        payload.nidn = profileForm.nidn.trim();
      }

      const res = await adminAPI.updateUserProfile(selectedUser.id, payload);
      if (!res.ok) {
        toast.error(res.error || 'Gagal memperbarui profil user');
        return;
      }

      toast.success(res.data?.message || 'Profil user berhasil diperbarui');
      resetDialogs();
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (passwordForm.new_password.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Konfirmasi password tidak sama');
      return;
    }

    setSaving(true);
    try {
      const res = await adminAPI.resetUserPassword(selectedUser.id, {
        role: selectedUser.role,
        new_password: passwordForm.new_password,
      });
      if (!res.ok) {
        toast.error(res.error || 'Gagal reset password');
        return;
      }

      toast.success(res.data?.message || 'Password berhasil direset');
      resetDialogs();
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState variant="table" label="Memuat daftar pengguna" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={TITLE_MAP['kelola-users'] || 'Kelola Users'}
        subtitle="Filter berdasarkan peran, perbarui profil akun, atur ulang kata sandi, atau ubah status aktif pengguna."
      />

      <div className="space-y-2">
        <span id="filter-role-label" className="block text-xs font-medium text-[var(--text-muted)]">
          Filter peran pengguna
        </span>
        <div
          role="group"
          aria-labelledby="filter-role-label"
          className="flex flex-wrap gap-2"
        >
          {Object.entries(roleCounts).map(([entryRole, count]) => {
            const active = filterRole === entryRole;
            const roleTitle =
              entryRole === 'all'
                ? 'Semua'
                : entryRole.charAt(0).toUpperCase() + entryRole.slice(1);
            return (
              <Button
                key={entryRole}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                aria-pressed={active}
                onClick={() => setFilterRole(entryRole)}
                className="gap-2"
              >
                <span>{roleTitle}</span>
                <span className="font-mono text-xs tabular-nums opacity-95">{count}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <Shield className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span>Daftar Pengguna</span>
          </CardTitle>
          <div className="w-full sm:w-72">
            <Field label="Cari pengguna">
              {(a11y) => (
                <Input
                  {...a11y}
                  name="search"
                  placeholder="Nama, email, NPM, atau NIDN..."
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
              icon={Shield}
              title="Tidak ada user"
              description="Belum ada pengguna terdaftar atau tidak ada data yang sesuai dengan filter."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Identitas</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user, index) => {
                  const color = ROLE_COLORS[user.role] || 'ctp-overlay1';
                  const isActive = user.is_active !== false;
                  return (
                    <TableRow key={user.id || index}>
                      <TableCell data-label="Pengguna" className="min-w-0">
                        <div className="min-w-0 space-y-0.5 text-right sm:text-left">
                          <p className="font-medium text-[var(--text-strong)] whitespace-normal break-words">
                            {user.nama || '-'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] whitespace-normal break-all">
                            {user.email || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell data-label="Peran">
                        <div className="flex flex-wrap justify-end gap-1.5 sm:justify-start">
                          <Badge
                            variant="outline"
                            className={`rounded-md capitalize border-[hsl(var(--${color})/0.35)] bg-[hsl(var(--${color})/0.12)] text-[hsl(var(--${color}))]`}
                          >
                            {user.role}
                          </Badge>
                          {user.role === 'mahasiswa' && user.jalur ? (
                            <Badge variant="secondary" className="rounded-md">
                              {String(user.jalur).toUpperCase()}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell data-label="Identitas">
                        <div className="font-mono text-xs tabular-nums text-[var(--text-body)]">
                          <span>{user.npm || user.nidn || '-'}</span>
                          {user.angkatan ? (
                            <span className="text-[var(--text-muted)]"> · {user.angkatan}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell data-label="Kontak">
                        <span className="font-mono text-xs tabular-nums text-[var(--text-body)] break-all">
                          {user.no_wa || '-'}
                        </span>
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge
                          status={isActive ? 'active' : 'revoked'}
                          label={isActive ? 'Aktif' : 'Nonaktif'}
                        />
                      </TableCell>
                      <TableCell data-label="Aksi">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit Profil</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openPasswordDialog(user)}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span>Reset Password</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggle(user)}
                          >
                            {isActive ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                            <span>{isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Hapus</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!saving && !open) resetDialogs();
        }}
      >
        <DialogContent className="max-w-2xl bg-[var(--surface-raised)] border-[var(--line)] text-[var(--text-strong)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-[var(--text-muted)]" />
              <span>Edit User</span>
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              Perbarui data dasar user dari panel admin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nama" required>
              {(a11y) => (
                <Input
                  {...a11y}
                  name="nama"
                  value={profileForm.nama}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, nama: e.target.value }))
                  }
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
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
            <Field label="No. WhatsApp">
              {(a11y) => (
                <Input
                  {...a11y}
                  name="no_wa"
                  value={profileForm.no_wa}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, no_wa: e.target.value }))
                  }
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
            {selectedUser?.role === 'mahasiswa' ? (
              <>
                <Field label="NPM" required>
                  {(a11y) => (
                    <Input
                      {...a11y}
                      name="npm"
                      value={profileForm.npm}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, npm: e.target.value }))
                      }
                      className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] font-mono tabular-nums"
                    />
                  )}
                </Field>
                <Field label="Angkatan">
                  {(a11y) => (
                    <Input
                      {...a11y}
                      name="angkatan"
                      value={profileForm.angkatan}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, angkatan: e.target.value }))
                      }
                      className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] font-mono tabular-nums"
                    />
                  )}
                </Field>
                <div className="md:col-span-2">
                  <Field label="Jalur">
                    {(a11y) => (
                      <Select
                        name="jalur"
                        value={profileForm.jalur}
                        onValueChange={(value) =>
                          setProfileForm((prev) => ({ ...prev, jalur: value }))
                        }
                      >
                        <SelectTrigger
                          id={a11y.id}
                          aria-describedby={a11y['aria-describedby']}
                          aria-invalid={a11y['aria-invalid']}
                          className="w-full bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                        >
                          <SelectValue placeholder="Pilih jalur" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)] text-[var(--text-strong)]">
                          {JALUR_OPTIONS.map((jalur) => (
                            <SelectItem key={jalur} value={jalur}>
                              {jalur.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                </div>
              </>
            ) : (
              <Field label="NIDN" required>
                {(a11y) => (
                  <Input
                    {...a11y}
                    name="nidn"
                    value={profileForm.nidn}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, nidn: e.target.value }))
                    }
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] font-mono tabular-nums"
                  />
                )}
              </Field>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={resetDialogs}>
              Batal
            </Button>
            <Button type="button" disabled={saving} onClick={handleSaveProfile}>
              <Save className="h-4 w-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordOpen}
        onOpenChange={(open) => {
          if (!saving && !open) resetDialogs();
        }}
      >
        <DialogContent className="bg-[var(--surface-raised)] border-[var(--line)] text-[var(--text-strong)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[var(--text-muted)]" />
              <span>Reset Password</span>
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              Set password baru untuk {selectedUser?.nama || 'user'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Password Baru" required hint="Minimal 8 karakter">
              {(a11y) => (
                <Input
                  {...a11y}
                  name="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))
                  }
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
            <Field label="Konfirmasi Password" required>
              {(a11y) => (
                <Input
                  {...a11y}
                  name="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }))
                  }
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={resetDialogs}>
              Batal
            </Button>
            <Button type="button" disabled={saving} onClick={handleResetPassword}>
              {saving ? 'Memproses...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!saving && !open) resetDialogs();
        }}
        title="Hapus User"
        description={
          selectedUser
            ? `Hapus user ${selectedUser.nama}? Aksi ini tidak dapat dibatalkan.`
            : 'Hapus user ini?'
        }
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  );
}
