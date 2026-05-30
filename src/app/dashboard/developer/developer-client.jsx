'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Globe2,
  Info,
  KeyRound,
  ListChecks,
  LockKeyhole,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  TerminalSquare,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react';
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
  'auth-trackers': 'Auth Tracker',
  devices: 'Device Lock',
  'redis-cache': 'Redis Cache',
  'permission-matrix': 'Permission Matrix',
};

const MODE_DESCRIPTIONS = {
  dashboard: 'Ringkasan teknis sistem Kavana dalam format yang mudah dipantau.',
  health: 'Status dependency utama, runtime, dan hasil synthetic test.',
  'audit-logs': 'Riwayat aksi penting lintas role dengan metadata yang sudah dirapikan.',
  'auth-logs': 'Riwayat login dan logout untuk investigasi akses akun.',
  'auth-trackers': 'Metadata kunjungan halaman login dan daftar.',
  devices: 'Device developer yang dikonfigurasi dan yang pernah dienroll.',
  'redis-cache': 'Key cache Redis yang aktif dan kontrol clear cache per prefix.',
  'permission-matrix': 'Peta akses efektif tiap role di sistem.',
};

const RESULT_TONE = {
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  ok: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  passed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  failed: 'border-red-400/30 bg-red-400/10 text-red-200',
  error: 'border-red-400/30 bg-red-400/10 text-red-200',
  revoked: 'border-red-400/30 bg-red-400/10 text-red-200',
  active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  default: 'border-[hsl(var(--ctp-overlay0)/0.5)] bg-[hsl(var(--ctp-surface1)/0.55)] text-[hsl(var(--ctp-subtext0))]',
};

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function normalizeLabel(value) {
  return String(value || '-')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseDetails(details) {
  if (!details) return null;
  if (typeof details === 'object') return details;
  try {
    return JSON.parse(details);
  } catch {
    return { catatan: String(details) };
  }
}

function compactValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function StatusPill({ value, ok }) {
  const normalized = ok === true ? 'ok' : ok === false ? 'failed' : String(value || 'default').toLowerCase();
  const tone = RESULT_TONE[normalized] || RESULT_TONE.default;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {normalized === 'failed' || normalized === 'error' ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      {normalizeLabel(value || normalized)}
    </span>
  );
}

function StatusCard({ title, value, description, icon: Icon, ok }) {
  return (
    <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="flex items-center gap-3 text-2xl text-[hsl(var(--ctp-text))]">
          {value}
          {ok !== undefined ? <StatusPill value={ok ? 'OK' : 'Issue'} ok={ok} /> : null}
        </CardTitle>
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

function EmptyState({ title = 'Belum ada data', description = 'Data belum tersedia dari backend.' }) {
  return (
    <div className="rounded-3xl border border-dashed border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-base)/0.35)] p-8 text-center">
      <Info className="mx-auto mb-3 h-8 w-8 text-[hsl(var(--ctp-subtext0))]" />
      <p className="font-semibold text-[hsl(var(--ctp-text))]">{title}</p>
      <p className="mt-1 text-sm text-[hsl(var(--ctp-subtext0))]">{description}</p>
    </div>
  );
}

function KeyValueGrid({ items }) {
  const entries = Object.entries(items || {}).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.45)] p-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ctp-subtext0))]">{normalizeLabel(key)}</p>
          <p className="mt-1 break-words text-sm font-semibold text-[hsl(var(--ctp-text))]">{compactValue(value)}</p>
        </div>
      ))}
    </div>
  );
}

function renderChecks(checks = []) {
  if (!Array.isArray(checks) || checks.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {checks.map((check) => (
        <div key={check.name} className="flex items-start justify-between gap-4 rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.45)] p-4">
          <div>
            <p className="font-semibold text-[hsl(var(--ctp-text))]">{normalizeLabel(check.name)}</p>
            <p className="mt-1 text-sm text-[hsl(var(--ctp-subtext0))]">
              {check.latency_ms !== undefined ? `${check.latency_ms} ms` : check.count !== undefined ? `${check.count} item` : check.error || 'Check selesai'}
            </p>
          </div>
          <StatusPill value={check.ok ? 'OK' : 'Issue'} ok={Boolean(check.ok)} />
        </div>
      ))}
    </div>
  );
}

function HealthView({ data }) {
  const isSynthetic = Array.isArray(data?.checks);
  const status = data?.status || (isSynthetic ? data.status : 'unknown');
  const dbOk = isSynthetic ? data.checks?.find((check) => check.name === 'database_ping')?.ok : data?.db?.ok;
  const redisOk = isSynthetic ? data.checks?.find((check) => check.name === 'redis_configured')?.ok : data?.redis?.ok || data?.redis?.configured;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard title="Overall" value={normalizeLabel(status)} description="Status sistem saat ini" icon={Activity} ok={status === 'ok' || status === 'passed'} />
        <StatusCard title="Database" value={dbOk ? 'OK' : 'Issue'} description={`${data?.db?.latency_ms ?? data?.checks?.find((check) => check.name === 'database_ping')?.latency_ms ?? '-'} ms`} icon={Server} ok={Boolean(dbOk)} />
        <StatusCard title="Redis" value={redisOk ? 'Aktif' : 'Tidak aktif'} description="Cache dan invalidasi data" icon={Database} ok={Boolean(redisOk)} />
        <StatusCard title="Turnstile" value={data?.runtime?.turnstile_enabled ? 'On' : '-'} description="Proteksi login" icon={Shield} ok={data?.runtime?.turnstile_enabled} />
      </div>

      {isSynthetic ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[hsl(var(--ctp-text))]">Hasil Synthetic Test</h3>
          {renderChecks(data.checks)}
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.45)] p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-[hsl(var(--ctp-text))]">
              <ListChecks className="h-4 w-4" />
              Dependency
            </h3>
            <KeyValueGrid
              items={{
                database: data?.db?.ok ? `OK (${data?.db?.latency_ms ?? '-'} ms)` : data?.db?.error || 'Issue',
                redis: data?.redis?.configured ? (data?.redis?.ok ? `OK (${data?.redis?.latency_ms ?? '-'} ms)` : data?.redis?.error || 'Configured') : 'Belum dikonfigurasi',
              }}
            />
          </div>
          <div className="rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.45)] p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-[hsl(var(--ctp-text))]">
              <Globe2 className="h-4 w-4" />
              Runtime
            </h3>
            <KeyValueGrid
              items={{
                environment: data?.runtime?.node_env,
                cors_origins: Array.isArray(data?.runtime?.cors_origins) ? data.runtime.cors_origins.join(', ') : '-',
                email_notifications: data?.runtime?.email_notifications_enabled ? 'Aktif' : 'Nonaktif',
                turnstile: data?.runtime?.turnstile_enabled ? 'Aktif' : 'Nonaktif',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LogsView({ data, type }) {
  const logs = Array.isArray(data) ? data : [];
  const successCount = logs.filter((log) => String(log.result || '').toLowerCase() === 'success').length;
  const failedCount = logs.filter((log) => String(log.result || '').toLowerCase() !== 'success').length;
  const uniqueRoles = new Set(logs.map((log) => log.role).filter(Boolean)).size;

  if (logs.length === 0) {
    return <EmptyState title="Log kosong" description="Belum ada log yang dikembalikan backend." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard title="Total Log" value={logs.length} description={`Log ${type === 'auth' ? 'auth' : 'audit'} terakhir`} icon={FileText} />
        <StatusCard title="Success" value={successCount} description="Aksi berhasil" icon={CheckCircle2} ok />
        <StatusCard title="Perlu Dicek" value={failedCount} description={`${uniqueRoles} role terlibat`} icon={AlertTriangle} ok={failedCount === 0} />
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          const details = parseDetails(log.details);
          const result = String(log.result || 'unknown').toLowerCase();

          return (
            <article key={log.id || log.request_id} className="rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.48)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={result} ok={result === 'success'} />
                    <span className="rounded-full border border-[hsl(var(--ctp-overlay0)/0.45)] px-3 py-1 text-xs text-[hsl(var(--ctp-subtext0))]">{normalizeLabel(log.role)}</span>
                    <span className="rounded-full border border-[hsl(var(--ctp-overlay0)/0.45)] px-3 py-1 text-xs text-[hsl(var(--ctp-subtext0))]">User #{log.user_id || '-'}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[hsl(var(--ctp-text))]">{normalizeLabel(log.action)}</h3>
                  <p className="text-sm text-[hsl(var(--ctp-subtext0))]">
                    Target: <span className="text-[hsl(var(--ctp-text))]">{log.target || '-'}</span>
                    {log.target_id ? ` #${log.target_id}` : ''}
                  </p>
                </div>
                <div className="text-left text-xs text-[hsl(var(--ctp-subtext0))] lg:text-right">
                  <p className="flex items-center gap-1 lg:justify-end">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateTime(log.created_at)}
                  </p>
                  <p className="mt-1">IP: {log.ip_address || '-'}</p>
                  <p className="mt-1 break-all">Request: {log.request_id || '-'}</p>
                </div>
              </div>

              {details ? (
                <div className="mt-4">
                  <KeyValueGrid items={details} />
                </div>
              ) : null}

              {log.user_agent ? (
                <p className="mt-3 truncate text-xs text-[hsl(var(--ctp-subtext0))]">User agent: {log.user_agent}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function AuthTrackerView({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const loginCount = rows.filter((row) => row.event_type === 'login').length;
  const registerCount = rows.filter((row) => row.event_type === 'register').length;
  const uniqueIps = new Set(rows.map((row) => row.isp_ip || row.request_ip).filter(Boolean)).size;

  if (rows.length === 0) {
    return <EmptyState title="Tracker kosong" description="Belum ada kunjungan halaman login atau daftar yang tercatat." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard title="Total Tracker" value={rows.length} description="Kunjungan login dan daftar" icon={Globe2} />
        <StatusCard title="Login" value={loginCount} description="Halaman masuk" icon={Shield} />
        <StatusCard title="Daftar" value={registerCount} description={`${uniqueIps} IP unik`} icon={MonitorSmartphone} />
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.48)] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill value={row.event_type === 'register' ? 'Daftar' : 'Login'} ok />
                  <span className="rounded-full border border-[hsl(var(--ctp-overlay0)/0.45)] px-3 py-1 text-xs text-[hsl(var(--ctp-subtext0))]">
                    {row.hostname || '-'}
                  </span>
                </div>
                <h3 className="break-all text-base font-semibold text-[hsl(var(--ctp-text))]">{row.url || '-'}</h3>
                <p className="truncate text-sm text-[hsl(var(--ctp-subtext0))]">{row.browser || '-'}</p>
              </div>
              <div className="text-left text-xs text-[hsl(var(--ctp-subtext0))] lg:text-right">
                <p className="flex items-center gap-1 lg:justify-end">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(row.created_at)}
                </p>
                <p className="mt-1 flex items-center gap-1 lg:justify-end">
                  <MapPin className="h-3.5 w-3.5" />
                  {[row.city, row.region, row.country_name].filter(Boolean).join(', ') || '-'}
                </p>
                <p className="mt-1">IP: {row.isp_ip || row.request_ip || '-'}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-subtext0))]">Client</p>
                <KeyValueGrid
                  items={{
                    browser_language: row.browser_language,
                    screen_resolution: row.screen_resolution,
                    timezone: row.timezone,
                    ontouchstart: row.ontouchstart,
                    tanggal_ambil: formatDateTime(row.tanggal_ambil),
                    request_ip: row.request_ip,
                  }}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-subtext0))]">ISP</p>
                <KeyValueGrid
                  items={{
                    ip: row.isp_ip,
                    city: row.city,
                    region: row.region,
                    country_name: row.country_name,
                    postal: row.postal,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    timezone: row.isp_timezone,
                    asn: row.asn,
                    org: row.org,
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DevicesView({ data, onRevoke }) {
  const configured = Array.isArray(data?.configured) ? data.configured : [];
  const database = Array.isArray(data?.database) ? data.database : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard title="Configured Device" value={configured.length} description="Dari GitHub Secret/env" icon={KeyRound} />
        <StatusCard title="Enrolled Device" value={database.length} description="Device tersimpan DB" icon={LockKeyhole} />
        <StatusCard title="Active Device" value={database.filter((device) => device.status === 'active').length} description="Masih boleh dipakai login" icon={ShieldCheck} />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--ctp-text))]">Device Dari Konfigurasi</h3>
        {configured.length === 0 ? (
          <EmptyState title="Belum ada configured device" description="Tambahkan DEVELOPER_DEVICE_IDS dan DEVELOPER_DEVICE_TOKEN_HASHES." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {configured.map((device) => (
              <div key={device.device_id} className="rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.45)] p-4">
                <p className="font-semibold text-[hsl(var(--ctp-text))]">{device.device_id}</p>
                <p className="mt-1 text-xs text-[hsl(var(--ctp-subtext0))]">Token hash: {device.token_hash || '-'}</p>
                <p className="mt-1 text-xs text-[hsl(var(--ctp-subtext0))]">Sumber: {device.source || 'env'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--ctp-text))]">Device Enrolled</h3>
        {database.length === 0 ? (
          <EmptyState title="Belum ada device yang dienroll" description="Enroll sekali dari browser developer agar cookie device tersimpan." />
        ) : (
          <div className="space-y-3">
            {database.map((device) => (
              <div key={device.id} className="flex flex-col gap-3 rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.48)] p-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[hsl(var(--ctp-text))]">{device.device_name || device.device_id}</p>
                    <StatusPill value={device.status} />
                  </div>
                  <p className="mt-1 text-sm text-[hsl(var(--ctp-subtext0))]">{device.developer_email}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--ctp-subtext0))]">Last login: {formatDateTime(device.last_login_at)} | IP: {device.last_ip || '-'}</p>
                </div>
                {device.status !== 'revoked' ? (
                  <Button type="button" variant="destructive" onClick={() => onRevoke(device.id)}>
                    Revoke
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RedisView({ data, cachePrefix, setCachePrefix, onClear }) {
  const keys = Array.isArray(data?.keys) ? data.keys : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard title="Redis" value={data?.configured ? 'Configured' : 'Off'} description="Status koneksi cache" icon={Database} ok={Boolean(data?.configured)} />
        <StatusCard title="Pattern" value={data?.pattern || '-'} description="Pattern pencarian key" icon={TerminalSquare} />
        <StatusCard title="Key Ditemukan" value={data?.count ?? keys.length} description="Dibatasi untuk keamanan UI" icon={ListChecks} />
      </div>

      <div className="flex flex-col gap-2 rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.45)] p-4 sm:flex-row">
        <Input value={cachePrefix} onChange={(event) => setCachePrefix(event.target.value)} placeholder="Prefix redis, contoh: kavana:" />
        <Button type="button" variant="destructive" onClick={onClear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Prefix
        </Button>
      </div>

      {keys.length === 0 ? (
        <EmptyState title="Tidak ada key cache" description="Redis aktif tapi tidak ada key yang cocok dengan pattern saat ini." />
      ) : (
        <div className="grid gap-2">
          {keys.map((key) => (
            <div key={key} className="rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.48)] px-4 py-3 font-mono text-xs text-[hsl(var(--ctp-subtext1))]">
              {key}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PermissionMatrixView({ data }) {
  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    return <EmptyState title="Permission matrix kosong" description="Backend belum mengirim data role dan permission." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entries.map(([role, permissions]) => (
        <div key={role} className="rounded-3xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.48)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[hsl(var(--ctp-text))]">{normalizeLabel(role)}</h3>
            <span className="rounded-full border border-[hsl(var(--ctp-overlay0)/0.45)] px-3 py-1 text-xs text-[hsl(var(--ctp-subtext0))]">
              {Array.isArray(permissions) ? permissions.length : 0} izin
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(permissions) ? permissions : []).map((permission) => (
              <span key={permission} className="rounded-full border border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface1)/0.45)] px-3 py-1 text-xs text-[hsl(var(--ctp-subtext1))]">
                {normalizeLabel(permission)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
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
      'auth-trackers': () => developerAPI.getAuthTrackers(100),
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
      if (mode === 'dashboard' || mode === 'health') setHealth(result.data);
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
  let renderedContent = <HealthView data={data} />;
  if (mode === 'dashboard' || mode === 'health') renderedContent = <HealthView data={health || data} />;
  if (mode === 'audit-logs') renderedContent = <LogsView data={data} type="audit" />;
  if (mode === 'auth-logs') renderedContent = <LogsView data={data} type="auth" />;
  if (mode === 'auth-trackers') renderedContent = <AuthTrackerView data={data} />;
  if (mode === 'devices') renderedContent = <DevicesView data={data} onRevoke={revokeDevice} />;
  if (mode === 'redis-cache') {
    renderedContent = <RedisView data={data} cachePrefix={cachePrefix} setCachePrefix={setCachePrefix} onClear={clearCache} />;
  }
  if (mode === 'permission-matrix') renderedContent = <PermissionMatrixView data={data} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {isDashboard && health ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard title="Database" value={health?.db?.ok ? 'OK' : 'Issue'} description={`${health?.db?.latency_ms ?? '-'} ms`} icon={Server} ok={Boolean(health?.db?.ok)} />
          <StatusCard title="Redis" value={health?.redis?.configured ? (health?.redis?.ok ? 'OK' : 'Configured') : 'Off'} description="Cache dan realtime backbone" icon={Database} ok={Boolean(health?.redis?.configured)} />
          <StatusCard title="Turnstile" value={health?.runtime?.turnstile_enabled ? 'On' : 'Off'} description="Login protection" icon={Shield} ok={Boolean(health?.runtime?.turnstile_enabled)} />
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
            <CardDescription>{MODE_DESCRIPTIONS[mode] || 'Panel teknis developer.'}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {(mode === 'dashboard' || mode === 'health') ? (
              <Button type="button" onClick={runSyntheticTests}>
                <Zap className="mr-2 h-4 w-4" />
                Run Synthetic Test
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>{renderedContent}</CardContent>
      </Card>
    </motion.div>
  );
}
