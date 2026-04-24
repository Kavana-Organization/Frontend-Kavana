'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Pencil, KeyRound, ToggleLeft, ToggleRight, Trash2, Save, UserCog,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog';
import { useAuthStore } from '@/store/auth-store';
import { adminAPI } from '@/lib/api';

function getInitials(n) { return (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2); }

const ROLE_COLORS = { mahasiswa: 'ctp-blue', dosen: 'ctp-green', koordinator: 'ctp-teal', kaprodi: 'ctp-mauve', admin: 'ctp-red' };
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

  const filtered = useMemo(() => users.filter((user) => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (!search) return true;
    const keyword = search.toLowerCase();
    return [user.nama, user.email, user.npm, user.nidn]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  }), [filterRole, search, users]);

  const roleCounts = useMemo(() => ({
    all: users.length,
    mahasiswa: users.filter((user) => user.role === 'mahasiswa').length,
    dosen: users.filter((user) => user.role === 'dosen').length,
    koordinator: users.filter((user) => user.role === 'koordinator').length,
    kaprodi: users.filter((user) => user.role === 'kaprodi').length,
    admin: users.filter((user) => user.role === 'admin').length,
  }), [users]);

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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Object.entries(roleCounts).map(([entryRole, count]) => (
          <Card
            key={entryRole}
            className={`cursor-pointer bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring ${filterRole === entryRole ? 'ring-2 ring-[hsl(var(--ctp-lavender))]' : ''}`}
            onClick={() => setFilterRole(entryRole)}
          >
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-[hsl(var(--ctp-subtext0))] capitalize">{entryRole === 'all' ? 'Semua' : entryRole}</p>
              <p className="text-xl font-bold text-[hsl(var(--ctp-text))]">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <Shield className="h-4 w-4" /> Kelola Users
          </CardTitle>
          <Input
            placeholder="Cari user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]"
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada user</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((user, index) => {
                const color = ROLE_COLORS[user.role] || 'ctp-overlay1';
                return (
                  <div
                    key={user.id || index}
                    className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 shrink-0 rounded-full bg-[hsl(var(--${color})/0.20)] text-[hsl(var(--${color}))] flex items-center justify-center text-sm font-bold`}>
                          {getInitials(user.nama)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[hsl(var(--ctp-text))] truncate">{user.nama || '-'}</p>
                          <p className="text-xs text-[hsl(var(--ctp-subtext0))] truncate">{user.email || '-'}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge className={`rounded-xl capitalize border border-[hsl(var(--${color})/0.35)] bg-[hsl(var(--${color})/0.12)] text-[hsl(var(--${color}))]`}>
                              {user.role}
                            </Badge>
                            {user.role === 'mahasiswa' && user.jalur ? (
                              <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
                                {String(user.jalur).toUpperCase()}
                              </Badge>
                            ) : null}
                            <Badge className={`rounded-xl border ${user.is_active === false ? 'border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))]' : 'border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]'}`}>
                              {user.is_active === false ? 'Nonaktif' : 'Aktif'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs text-[hsl(var(--ctp-subtext0))] sm:grid-cols-3 xl:min-w-[420px]">
                        <div className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.25)] px-3 py-2">
                          <div className="text-[hsl(var(--ctp-overlay1))]">Identitas</div>
                          <div className="mt-1 font-medium text-[hsl(var(--ctp-text))]">{user.npm || user.nidn || '-'}</div>
                        </div>
                        <div className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.25)] px-3 py-2">
                          <div className="text-[hsl(var(--ctp-overlay1))]">No. WA</div>
                          <div className="mt-1 font-medium text-[hsl(var(--ctp-text))]">{user.no_wa || '-'}</div>
                        </div>
                        <div className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.25)] px-3 py-2">
                          <div className="text-[hsl(var(--ctp-overlay1))]">Angkatan</div>
                          <div className="mt-1 font-medium text-[hsl(var(--ctp-text))]">{user.angkatan || '-'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="rounded-xl bg-[hsl(var(--ctp-blue)/0.16)] text-[hsl(var(--ctp-blue))] hover:bg-[hsl(var(--ctp-blue)/0.24)] border border-[hsl(var(--ctp-blue)/0.28)]"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit Profil
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openPasswordDialog(user)}
                        className="rounded-xl bg-[hsl(var(--ctp-mauve)/0.16)] text-[hsl(var(--ctp-mauve))] hover:bg-[hsl(var(--ctp-mauve)/0.24)] border border-[hsl(var(--ctp-mauve)/0.28)]"
                      >
                        <KeyRound className="h-3.5 w-3.5 mr-1" />
                        Reset Password
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(user)}
                        className={`rounded-xl border ${user.is_active === false ? 'text-[hsl(var(--ctp-green))] border-[hsl(var(--ctp-green)/0.28)] bg-[hsl(var(--ctp-green)/0.10)]' : 'text-[hsl(var(--ctp-peach))] border-[hsl(var(--ctp-peach)/0.28)] bg-[hsl(var(--ctp-peach)/0.10)]'}`}
                      >
                        {user.is_active === false ? <ToggleLeft className="h-4 w-4 mr-1" /> : <ToggleRight className="h-4 w-4 mr-1" />}
                        {user.is_active === false ? 'Aktifkan' : 'Nonaktifkan'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteDialogOpen(true);
                        }}
                        className="rounded-xl border border-[hsl(var(--ctp-red)/0.28)] bg-[hsl(var(--ctp-red)/0.10)] text-[hsl(var(--ctp-red))]"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(open) => { if (!saving && !open) resetDialogs(); }}>
        <DialogContent className="border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0))] text-[hsl(var(--ctp-text))] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" /> Edit User
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--ctp-subtext0))]">
              Perbarui data dasar user dari panel admin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={profileForm.nama} onChange={(e) => setProfileForm((prev) => ({ ...prev, nama: e.target.value }))} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
            </div>
            <div className="space-y-2">
              <Label>No. WhatsApp</Label>
              <Input value={profileForm.no_wa} onChange={(e) => setProfileForm((prev) => ({ ...prev, no_wa: e.target.value }))} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
            </div>
            {selectedUser?.role === 'mahasiswa' ? (
              <>
                <div className="space-y-2">
                  <Label>NPM</Label>
                  <Input value={profileForm.npm} onChange={(e) => setProfileForm((prev) => ({ ...prev, npm: e.target.value }))} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
                </div>
                <div className="space-y-2">
                  <Label>Angkatan</Label>
                  <Input value={profileForm.angkatan} onChange={(e) => setProfileForm((prev) => ({ ...prev, angkatan: e.target.value }))} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Jalur</Label>
                  <Select value={profileForm.jalur} onValueChange={(value) => setProfileForm((prev) => ({ ...prev, jalur: value }))}>
                    <SelectTrigger className="w-full bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]">
                      <SelectValue placeholder="Pilih jalur" />
                    </SelectTrigger>
                    <SelectContent className="border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0))] text-[hsl(var(--ctp-text))]">
                      {JALUR_OPTIONS.map((jalur) => (
                        <SelectItem key={jalur} value={jalur}>
                          {jalur.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>NIDN</Label>
                <Input value={profileForm.nidn} onChange={(e) => setProfileForm((prev) => ({ ...prev, nidn: e.target.value }))} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" disabled={saving} onClick={resetDialogs} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
              Batal
            </Button>
            <Button type="button" disabled={saving} onClick={handleSaveProfile} className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]">
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={(open) => { if (!saving && !open) resetDialogs(); }}>
        <DialogContent className="border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0))] text-[hsl(var(--ctp-text))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Reset Password
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--ctp-subtext0))]">
              Set password baru untuk {selectedUser?.nama || 'user'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password</Label>
              <Input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))} className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" disabled={saving} onClick={resetDialogs} className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
              Batal
            </Button>
            <Button type="button" disabled={saving} onClick={handleResetPassword} className="rounded-2xl bg-[hsl(var(--ctp-mauve)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-mauve)/0.30)] border border-[hsl(var(--ctp-mauve)/0.35)]">
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
        description={selectedUser ? `Hapus user ${selectedUser.nama}? Aksi ini tidak dapat dibatalkan.` : 'Hapus user ini?'}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        loading={saving}
      />
    </motion.div>
  );
}
