'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Clock, Database, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { adminAPI } from '@/lib/api';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID');
}

function parseDetails(details) {
  if (!details) return null;
  if (typeof details === 'object') return details;
  try {
    return JSON.parse(details);
  } catch (_) {
    return null;
  }
}

function formatDetailValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function mapResultToStatus(result) {
  const normalized = String(result || '').trim().toLowerCase();
  if (['success', 'ok', 'passed', 'active'].includes(normalized)) return 'approved';
  if (['pending', 'waiting', 'warning'].includes(normalized)) return 'pending';
  if (['failed', 'error', 'revoked', 'rejected'].includes(normalized)) return 'rejected';
  return 'neutral';
}

export default function MonitoringSistemPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [statsRes, activityRes, auditRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRecentActivity(),
        adminAPI.getAuditLogs({ limit: 50 }),
      ]);

      if (statsRes.ok) setStats(statsRes.data || {});
      if (activityRes.ok) setActivities(Array.isArray(activityRes.data) ? activityRes.data : []);
      if (auditRes.ok) setAuditLogs(Array.isArray(auditRes.data) ? auditRes.data : []);
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

  const filteredAuditLogs = useMemo(() => {
    if (!search) return auditLogs;
    const keyword = search.toLowerCase();
    return auditLogs.filter((log) => {
      const details = parseDetails(log.details);
      return [
        log.action,
        log.target,
        log.target_id,
        log.user_id,
        log.result,
        details ? JSON.stringify(details) : '',
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [auditLogs, search]);

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat data monitoring sistem" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Sistem"
        subtitle="Pantau aktivitas sistem terbaru, indikator operasional, dan riwayat audit log."
      />

      {/* Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        {[
          { label: 'Total Users', value: stats.total_users || 0, cls: 'text-[var(--text-strong)]' },
          { label: 'Mahasiswa', value: stats.total_mahasiswa || 0, cls: 'text-[hsl(var(--ctp-blue))]' },
          { label: 'Dosen', value: stats.total_dosen || 0, cls: 'text-[hsl(var(--ctp-green))]' },
          { label: 'Admin', value: stats.total_admin || 0, cls: 'text-[hsl(var(--ctp-red))]' },
        ].map((item) => (
          <div key={item.label} className="bg-[var(--surface-raised)] p-4 sm:p-5 min-w-0">
            <p className="text-xs font-medium text-[var(--text-muted)]">{item.label}</p>
            <p className={`mt-1 text-2xl font-semibold font-mono tabular-nums ${item.cls}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card variant="muted" className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Clock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span>Aktivitas Terbaru</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Tidak ada aktivitas"
                description="Aktivitas terbaru sistem akan tercatat di sini."
              />
            ) : (
              <Table stackOnMobile>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aktivitas</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity, index) => (
                    <TableRow key={activity.id || index}>
                      <TableCell data-label="Aktivitas" className="min-w-0">
                        <span className="text-sm text-[var(--text-strong)] whitespace-normal break-words">
                          {activity.message || activity.action || '-'}
                        </span>
                      </TableCell>
                      <TableCell data-label="Waktu">
                        <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                          {formatDateTime(activity.created_at || activity.timestamp)}
                        </span>
                      </TableCell>
                      <TableCell data-label="Status" className="sm:text-right">
                        <StatusBadge
                          status={mapResultToStatus(activity.result || 'success')}
                          label={activity.result || 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card variant="muted" className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Database className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span>Status Sistem</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
              {[
                { label: 'Proposal Pending', value: stats.proposal_pending || 0, cls: 'text-[hsl(var(--ctp-peach))]' },
                { label: 'Bimbingan Aktif', value: stats.bimbingan_aktif || 0, cls: 'text-[hsl(var(--ctp-blue))]' },
                { label: 'Laporan Pending', value: stats.laporan_pending || 0, cls: 'text-[hsl(var(--ctp-mauve))]' },
                { label: 'Sidang Scheduled', value: stats.sidang_scheduled || 0, cls: 'text-[hsl(var(--ctp-green))]' },
                { label: 'User Nonaktif', value: stats.users_inactive || 0, cls: 'text-[hsl(var(--ctp-red))]' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-[var(--text-muted)]">{item.label}</span>
                  <span className={`text-base font-semibold font-mono tabular-nums ${item.cls}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="muted" className="min-w-0">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <Shield className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span>Audit Logs</span>
          </CardTitle>
          <div className="w-full sm:w-80">
            <Field label="Cari audit log">
              {(a11y) => (
                <Input
                  {...a11y}
                  name="search"
                  placeholder="Cari action, target, user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAuditLogs.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Tidak ada audit log"
              description="Belum ada log audit atau tidak ada entri yang cocok dengan kata kunci pencarian."
            />
          ) : (
            <div className="space-y-3">
              {filteredAuditLogs.map((log, index) => {
                const details = parseDetails(log.details);
                const detailEntries =
                  details && typeof details === 'object' && !Array.isArray(details)
                    ? Object.entries(details)
                    : details !== null
                      ? [['data', details]]
                      : [];

                return (
                  <article
                    key={log.id || index}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 min-w-0"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-md font-mono text-xs">
                            {log.action || '-'}
                          </Badge>
                          <StatusBadge
                            status={mapResultToStatus(log.result)}
                            label={log.result || 'unknown'}
                          />
                          {log.target ? (
                            <Badge variant="secondary" className="rounded-md font-mono text-xs">
                              {log.target}
                              {log.target_id ? ` #${log.target_id}` : ''}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="font-mono text-xs tabular-nums text-[var(--text-muted)] break-all">
                          Admin/User: {log.user_id || '-'} · Role: {log.role || '-'} · Request:{' '}
                          {log.request_id || '-'}
                        </p>
                      </div>
                      <div className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-muted)] lg:text-right">
                        <div>{formatDateTime(log.created_at)}</div>
                        <div className="mt-1 break-all">{log.ip_address || '-'}</div>
                      </div>
                    </div>

                    {details ? (
                      <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-3 min-w-0">
                        {detailEntries.length > 0 ? (
                          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {detailEntries.map(([key, value]) => (
                              <div
                                key={key}
                                className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2"
                              >
                                <dt className="text-xs font-medium text-[var(--text-muted)] break-words">
                                  {key}
                                </dt>
                                <dd className="mt-0.5 font-mono text-xs tabular-nums text-[var(--text-strong)] break-all">
                                  {formatDetailValue(value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}

                        <details className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)]">
                          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                            Lihat JSON mentah
                          </summary>
                          <pre className="overflow-x-auto border-t border-[var(--line)] p-3 font-mono text-xs text-[var(--text-body)] whitespace-pre-wrap break-all">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
