'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Server, Database, Clock, Shield, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.total_users || 0, icon: Activity, color: 'ctp-text' },
          { label: 'Mahasiswa', value: stats.total_mahasiswa || 0, icon: Server, color: 'ctp-blue' },
          { label: 'Dosen', value: stats.total_dosen || 0, icon: Database, color: 'ctp-green' },
          { label: 'Admin', value: stats.total_admin || 0, icon: Shield, color: 'ctp-red' },
        ].map((item) => (
          <Card key={item.label} className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{item.label}</p>
                <item.icon className={`h-4 w-4 text-[hsl(var(--${item.color}))]`} />
              </div>
              <p className={`text-2xl font-bold text-[hsl(var(--${item.color}))] mt-1`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <Clock className="h-4 w-4" /> Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
                <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--ctp-green))] mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-[hsl(var(--ctp-text))]">{activity.message || activity.action || '-'}</p>
                      <p className="text-xs text-[hsl(var(--ctp-subtext0))] mt-1">{formatDateTime(activity.created_at || activity.timestamp)}</p>
                    </div>
                    <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
                      {activity.result || 'success'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <Database className="h-4 w-4" /> Status Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Proposal Pending', value: stats.proposal_pending || 0, color: 'ctp-peach' },
              { label: 'Bimbingan Aktif', value: stats.bimbingan_aktif || 0, color: 'ctp-blue' },
              { label: 'Laporan Pending', value: stats.laporan_pending || 0, color: 'ctp-mauve' },
              { label: 'Sidang Scheduled', value: stats.sidang_scheduled || 0, color: 'ctp-green' },
              { label: 'User Nonaktif', value: stats.users_inactive || 0, color: 'ctp-red' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--ctp-subtext0))]">{item.label}</span>
                <span className={`text-base font-semibold text-[hsl(var(--${item.color}))]`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <Shield className="h-4 w-4" /> Audit Logs
          </CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--ctp-overlay1))]" />
            <Input
              placeholder="Cari action, target, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredAuditLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" />
              <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada audit log</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAuditLogs.map((log) => {
                const details = parseDetails(log.details);
                const resultClass = log.result === 'success'
                  ? 'border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]'
                  : 'border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))]';

                return (
                  <div key={log.id} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="rounded-xl border border-[hsl(var(--ctp-blue)/0.35)] bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))]">
                            {log.action}
                          </Badge>
                          <Badge className={`rounded-xl border ${resultClass}`}>
                            {log.result}
                          </Badge>
                          {log.target ? (
                            <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
                              {log.target}{log.target_id ? ` #${log.target_id}` : ''}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-[hsl(var(--ctp-subtext0))]">
                          Admin/User: {log.user_id || '-'} • Role: {log.role || '-'} • Request: {log.request_id || '-'}
                        </p>
                        {details ? (
                          <pre className="whitespace-pre-wrap rounded-xl border border-[hsl(var(--ctp-overlay0)/0.25)] bg-[hsl(var(--ctp-surface1)/0.20)] p-3 text-xs text-[hsl(var(--ctp-subtext1))] overflow-x-auto">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                      <div className="text-xs text-[hsl(var(--ctp-subtext0))] lg:text-right">
                        <div>{formatDateTime(log.created_at)}</div>
                        <div className="mt-1">{log.ip_address || '-'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
