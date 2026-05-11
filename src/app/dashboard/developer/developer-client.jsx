'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, KeyRound, Server, Shield, TerminalSquare, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { developerAPI } from '@/lib/api';
import { toast } from '@/lib/alert';

const MODE_LABELS = {
  dashboard: 'Developer Center',
  health: 'System Health',
  'audit-logs': 'Audit Logs',
  'auth-logs': 'Auth Logs',
  devices: 'Device Lock',
  'redis-cache': 'Redis Cache',
  'permission-matrix': 'Permission Matrix',
};

function JsonBlock({ data }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-crust)/0.72)] p-4 text-xs leading-6 text-[hsl(var(--ctp-subtext1))]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function StatusCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl text-[hsl(var(--ctp-text))]">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-[hsl(var(--ctp-subtext0))]">
        <span>{description}</span>
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.5)] bg-[hsl(var(--ctp-surface1)/0.55)]">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}

export default function DeveloperClient({ mode = 'dashboard' }) {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cachePrefix, setCachePrefix] = useState('kavana:');

  const load = useCallback(async () => {
    setLoading(true);
    const apiByMode = {
      dashboard: developerAPI.getHealth,
      health: developerAPI.getHealth,
      'audit-logs': () => developerAPI.getAuditLogs(100),
      'auth-logs': () => developerAPI.getAuthLogs(100),
      devices: developerAPI.getDevices,
      'redis-cache': () => developerAPI.getRedisKeys('kavana:*'),
      'permission-matrix': developerAPI.getPermissionMatrix,
    };

    const result = await (apiByMode[mode] || developerAPI.getHealth)();
    if (result.ok) {
      setData(result.data);
      if (mode === 'dashboard' || mode === 'health') setHealth(result.data);
    } else {
      toast.error(result.error || 'Gagal memuat data developer');
    }
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const runSyntheticTests = async () => {
    const result = await developerAPI.runSyntheticTests();
    if (result.ok) {
      toast.success('Synthetic test selesai');
      setData(result.data);
      return;
    }
    toast.error(result.error || 'Synthetic test gagal');
  };

  const clearCache = async () => {
    const result = await developerAPI.clearCache({ prefix: cachePrefix });
    if (result.ok) {
      toast.success(`Cache dibersihkan: ${result.data.count || 0} key`);
      load();
      return;
    }
    toast.error(result.error || 'Gagal membersihkan cache');
  };

  const revokeDevice = async (id) => {
    const result = await developerAPI.revokeDevice(id);
    if (result.ok) {
      toast.success('Device dicabut');
      load();
      return;
    }
    toast.error(result.error || 'Gagal mencabut device');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--ctp-blue)/0.3)] border-t-[hsl(var(--ctp-blue))]" />
      </div>
    );
  }

  const isDashboard = mode === 'dashboard';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {isDashboard ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard title="Database" value={health?.db?.ok ? 'OK' : 'Issue'} description={`${health?.db?.latency_ms ?? '-'} ms`} icon={Server} />
          <StatusCard title="Redis" value={health?.redis?.configured ? (health?.redis?.ok ? 'OK' : 'Configured') : 'Off'} description="Cache dan realtime backbone" icon={Database} />
          <StatusCard title="Turnstile" value={health?.runtime?.turnstile_enabled ? 'On' : 'Off'} description="Login protection" icon={Shield} />
          <StatusCard title="Mode" value={health?.runtime?.node_env || '-'} description="Runtime environment" icon={Activity} />
        </div>
      ) : null}

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <TerminalSquare className="h-5 w-5" />
              {MODE_LABELS[mode] || 'Developer Center'}
            </CardTitle>
            <CardDescription>Panel teknis dengan akses penuh dan output yang sudah disanitasi.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={load}>Refresh</Button>
            <Button type="button" onClick={runSyntheticTests}>Run Synthetic Test</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'redis-cache' ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={cachePrefix} onChange={(event) => setCachePrefix(event.target.value)} placeholder="Prefix redis, contoh: kavana:" />
              <Button type="button" variant="destructive" onClick={clearCache}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Prefix
              </Button>
            </div>
          ) : null}

          {mode === 'devices' && Array.isArray(data?.database) ? (
            <div className="space-y-3">
              {data.database.map((device) => (
                <div key={device.id} className="flex flex-col gap-3 rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.54)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-[hsl(var(--ctp-text))]">
                      <KeyRound className="h-4 w-4" />
                      {device.device_name || device.device_id}
                    </div>
                    <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Status: {device.status} | Last login: {device.last_login_at || '-'}</p>
                  </div>
                  {device.status !== 'revoked' ? (
                    <Button type="button" variant="destructive" onClick={() => revokeDevice(device.id)}>Revoke</Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <JsonBlock data={data} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
