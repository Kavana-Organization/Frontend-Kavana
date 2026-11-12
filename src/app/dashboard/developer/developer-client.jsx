'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Globe2,
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
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  'auth-trackers': 'Metadata kunjungan dan event submit login/daftar.',
  devices: 'Device developer yang dikonfigurasi dan yang pernah dienroll.',
  'redis-cache': 'Key cache Redis yang aktif dan kontrol clear cache per prefix.',
  'permission-matrix': 'Peta akses efektif tiap role di sistem.',
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

function mapPillTone(normalized) {
  if (['success', 'ok', 'passed', 'active'].includes(normalized)) return 'approved';
  if (['warning', 'pending'].includes(normalized)) return 'pending';
  if (['failed', 'error', 'revoked', 'rejected'].includes(normalized)) return 'rejected';
  return 'neutral';
}

function StatusPill({ value, ok }) {
  const normalized =
    ok === true ? 'ok' : ok === false ? 'failed' : String(value || 'default').toLowerCase();
  return <StatusBadge status={mapPillTone(normalized)} label={normalizeLabel(value || normalized)} />;
}

function StatusCard({ title, value, description, icon: Icon, ok }) {
  return (
    <Card variant="muted" className="min-w-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-xs font-medium text-[var(--text-muted)]">
            {title}
          </CardDescription>
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" /> : null}
        </div>
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl font-semibold text-[var(--text-strong)] font-mono tabular-nums break-words">
          <span>{value}</span>
          {ok !== undefined ? <StatusPill value={ok ? 'OK' : 'Issue'} ok={ok} /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-[var(--text-muted)] tabular-nums break-words">{description}</p>
      </CardContent>
    </Card>
  );
}

function KeyValueGrid({ items }) {
  const entries = Object.entries(items || {}).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return null;

  return (
    <dl className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-3"
        >
          <dt className="text-xs font-medium text-[var(--text-muted)] break-words">
            {normalizeLabel(key)}
          </dt>
          <dd className="mt-1 break-all font-mono text-xs font-medium tabular-nums text-[var(--text-strong)]">
            {compactValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function renderChecks(checks = []) {
  if (!Array.isArray(checks) || checks.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {checks.map((check) => (
        <div
          key={check.name}
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 min-w-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-strong)] break-words">
              {normalizeLabel(check.name)}
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums text-[var(--text-muted)] break-words">
              {check.latency_ms !== undefined
                ? `${check.latency_ms} ms`
                : check.count !== undefined
                  ? `${check.count} item`
                  : check.error || 'Check selesai'}
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
  const dbOk = isSynthetic
    ? data.checks?.find((check) => check.name === 'database_ping')?.ok
    : data?.db?.ok;
  const redisOk = isSynthetic
    ? data.checks?.find((check) => check.name === 'redis_configured')?.ok
    : data?.redis?.ok || data?.redis?.configured;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Overall"
          value={normalizeLabel(status)}
          description="Status sistem saat ini"
          icon={Activity}
          ok={status === 'ok' || status === 'passed'}
        />
        <StatusCard
          title="Database"
          value={dbOk ? 'OK' : 'Issue'}
          description={`${data?.db?.latency_ms ?? data?.checks?.find((check) => check.name === 'database_ping')?.latency_ms ?? '-'} ms`}
          icon={Server}
          ok={Boolean(dbOk)}
        />
        <StatusCard
          title="Redis"
          value={redisOk ? 'Aktif' : 'Tidak aktif'}
          description="Cache dan invalidasi data"
          icon={Database}
          ok={Boolean(redisOk)}
        />
        <StatusCard
          title="Turnstile"
          value={data?.runtime?.turnstile_enabled ? 'On' : '-'}
          description="Proteksi login"
          icon={Shield}
          ok={data?.runtime?.turnstile_enabled}
        />
      </div>

      {isSynthetic ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-strong)]">Hasil Synthetic Test</h2>
          {renderChecks(data.checks)}
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="muted" className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--text-strong)]">
                <ListChecks className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <span>Dependency</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueGrid
                items={{
                  database: data?.db?.ok
                    ? `OK (${data?.db?.latency_ms ?? '-'} ms)`
                    : data?.db?.error || 'Issue',
                  redis: data?.redis?.configured
                    ? data?.redis?.ok
                      ? `OK (${data?.redis?.latency_ms ?? '-'} ms)`
                      : data?.redis?.error || 'Configured'
                    : 'Belum dikonfigurasi',
                }}
              />
            </CardContent>
          </Card>

          <Card variant="muted" className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--text-strong)]">
                <Globe2 className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <span>Runtime</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueGrid
                items={{
                  environment: data?.runtime?.node_env,
                  cors_origins: Array.isArray(data?.runtime?.cors_origins)
                    ? data.runtime.cors_origins.join(', ')
                    : '-',
                  email_notifications: data?.runtime?.email_notifications_enabled
                    ? 'Aktif'
                    : 'Nonaktif',
                  turnstile: data?.runtime?.turnstile_enabled ? 'Aktif' : 'Nonaktif',
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function LogsView({ data, type }) {
  const logs = Array.isArray(data) ? data : [];
  const successCount = logs.filter(
    (log) => String(log.result || '').toLowerCase() === 'success'
  ).length;
  const failedCount = logs.filter(
    (log) => String(log.result || '').toLowerCase() !== 'success'
  ).length;
  const uniqueRoles = new Set(logs.map((log) => log.role).filter(Boolean)).size;

  if (logs.length === 0) {
    return <EmptyState icon={FileText} title="Log kosong" description="Belum ada log yang dikembalikan backend." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          title="Total Log"
          value={logs.length}
          description={`Log ${type === 'auth' ? 'auth' : 'audit'} terakhir`}
          icon={FileText}
        />
        <StatusCard title="Success" value={successCount} description="Aksi berhasil" icon={CheckCircle2} ok />
        <StatusCard
          title="Perlu Dicek"
          value={failedCount}
          description={`${uniqueRoles} role terlibat`}
          icon={AlertTriangle}
          ok={failedCount === 0}
        />
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => {
          const details = parseDetails(log.details);
          const result = String(log.result || 'unknown').toLowerCase();

          return (
            <article
              key={log.id || log.request_id || index}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 min-w-0"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={result} ok={result === 'success'} />
                    <Badge variant="outline" className="rounded-md">
                      {normalizeLabel(log.role)}
                    </Badge>
                    <Badge variant="secondary" className="rounded-md font-mono text-xs tabular-nums">
                      User #{log.user_id || '-'}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-strong)] break-words">
                    {normalizeLabel(log.action)}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] break-words">
                    Target:{' '}
                    <span className="font-mono text-xs text-[var(--text-strong)]">
                      {log.target || '-'}
                      {log.target_id ? ` #${log.target_id}` : ''}
                    </span>
                  </p>
                </div>

                <div className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-muted)] lg:text-right">
                  <p className="flex items-center gap-1 lg:justify-end">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{formatDateTime(log.created_at)}</span>
                  </p>
                  <p className="mt-1 break-all">IP: {log.ip_address || '-'}</p>
                  <p className="mt-1 break-all">Request: {log.request_id || '-'}</p>
                </div>
              </div>

              {details ? (
                <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-3 min-w-0">
                  <KeyValueGrid items={details} />
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

              {log.user_agent ? (
                <p className="mt-3 font-mono text-xs text-[var(--text-muted)] break-all">
                  User agent: {log.user_agent}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function isPageVisitTracker(row) {
  return (
    row.event_category === 'page_visit' ||
    ['login', 'register', 'login_page_visit', 'register_page_visit'].includes(row.event_type)
  );
}

function isFailedAuthTracker(row) {
  return row.auth_status === 'failed' || String(row.event_type || '').endsWith('_failed');
}

function getTrackerTitle(row) {
  if (row.identifier_hint) return row.identifier_hint;
  if (row.url) return row.url;
  return row.hostname || '-';
}

function AuthTrackerView({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const pageVisitCount = rows.filter(isPageVisitTracker).length;
  const authEventCount = rows.length - pageVisitCount;
  const failedCount = rows.filter(isFailedAuthTracker).length;
  const uniqueIps = new Set(rows.map((row) => row.isp_ip || row.request_ip).filter(Boolean)).size;

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Globe2}
        title="Tracker kosong"
        description="Belum ada kunjungan atau event login/daftar yang tercatat."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Total Tracker"
          value={rows.length}
          description={`${uniqueIps} IP unik`}
          icon={Globe2}
        />
        <StatusCard
          title="Page Visit"
          value={pageVisitCount}
          description="Dedupe 24 jam/browser"
          icon={MonitorSmartphone}
        />
        <StatusCard
          title="Auth Event"
          value={authEventCount}
          description="Setiap submit login/daftar"
          icon={Shield}
        />
        <StatusCard
          title="Failed"
          value={failedCount}
          description="Login/daftar gagal"
          icon={AlertTriangle}
          ok={failedCount === 0}
        />
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const failed = isFailedAuthTracker(row);

          return (
            <article
              key={row.id || index}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 min-w-0"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={row.event_type} ok={failed ? false : undefined} />
                    <Badge variant="outline" className="rounded-md">
                      {normalizeLabel(
                        row.event_category || (isPageVisitTracker(row) ? 'page_visit' : 'auth_event')
                      )}
                    </Badge>
                    {row.auth_status ? <StatusPill value={row.auth_status} ok={!failed} /> : null}
                    <Badge variant="secondary" className="rounded-md font-mono text-xs">
                      {row.hostname || '-'}
                    </Badge>
                  </div>
                  <h3 className="break-all font-mono text-sm font-semibold text-[var(--text-strong)]">
                    {getTrackerTitle(row)}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] break-words">
                    {row.browser || '-'}
                  </p>
                </div>

                <div className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-muted)] lg:text-right">
                  <p className="flex items-center gap-1 lg:justify-end">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{formatDateTime(row.created_at)}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1 lg:justify-end font-sans">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {[row.city, row.region, row.country_name].filter(Boolean).join(', ') || '-'}
                    </span>
                  </p>
                  <p className="mt-1 break-all">IP: {row.isp_ip || row.request_ip || '-'}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3 border-t border-[var(--line)] pt-4">
                <div className="min-w-0">
                  <p className="mb-2 micro-label text-xs font-semibold text-[var(--text-muted)]">
                    Auth
                  </p>
                  <KeyValueGrid
                    items={{
                      flow: row.auth_flow,
                      stage: row.auth_stage,
                      status: row.auth_status,
                      identifier: row.identifier_hint,
                      failure_reason: row.failure_reason,
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 micro-label text-xs font-semibold text-[var(--text-muted)]">
                    Client
                  </p>
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
                <div className="min-w-0">
                  <p className="mb-2 micro-label text-xs font-semibold text-[var(--text-muted)]">
                    ISP
                  </p>
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
          );
        })}
      </div>
    </div>
  );
}

function DevicesView({ data, onRevoke }) {
  const configured = Array.isArray(data?.configured) ? data.configured : [];
  const database = Array.isArray(data?.database) ? data.database : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          title="Configured Device"
          value={configured.length}
          description="Dari GitHub Secret/env"
          icon={KeyRound}
        />
        <StatusCard
          title="Enrolled Device"
          value={database.length}
          description="Device tersimpan DB"
          icon={LockKeyhole}
        />
        <StatusCard
          title="Active Device"
          value={database.filter((device) => device.status === 'active').length}
          description="Masih boleh dipakai login"
          icon={ShieldCheck}
        />
      </div>

      <Card variant="muted" className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base text-[var(--text-strong)]">
            Device Dari Konfigurasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configured.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="Belum ada configured device"
              description="Tambahkan DEVELOPER_DEVICE_IDS dan DEVELOPER_DEVICE_TOKEN_HASHES."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Token Hash</TableHead>
                  <TableHead>Sumber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configured.map((device) => (
                  <TableRow key={device.device_id}>
                    <TableCell data-label="Device ID" className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-[var(--text-strong)] break-all">
                        {device.device_id}
                      </span>
                    </TableCell>
                    <TableCell data-label="Token Hash" className="min-w-0">
                      <span className="font-mono text-xs text-[var(--text-muted)] break-all">
                        {device.token_hash || '-'}
                      </span>
                    </TableCell>
                    <TableCell data-label="Sumber">
                      <Badge variant="outline" className="rounded-md font-mono text-xs">
                        {device.source || 'env'}
                      </Badge>
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
          <CardTitle className="text-base text-[var(--text-strong)]">Device Enrolled</CardTitle>
        </CardHeader>
        <CardContent>
          {database.length === 0 ? (
            <EmptyState
              icon={LockKeyhole}
              title="Belum ada device yang dienroll"
              description="Enroll sekali dari browser developer agar cookie device tersimpan."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login Terakhir</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {database.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell data-label="Device" className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-[var(--text-strong)] break-all">
                        {device.device_name || device.device_id}
                      </span>
                    </TableCell>
                    <TableCell data-label="Email" className="min-w-0">
                      <span className="text-sm text-[var(--text-body)] whitespace-normal break-all">
                        {device.developer_email || '-'}
                      </span>
                    </TableCell>
                    <TableCell data-label="Status">
                      <StatusPill value={device.status} />
                    </TableCell>
                    <TableCell data-label="Login Terakhir">
                      <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {formatDateTime(device.last_login_at)}
                      </span>
                    </TableCell>
                    <TableCell data-label="IP">
                      <span className="font-mono text-xs tabular-nums text-[var(--text-muted)] break-all">
                        {device.last_ip || '-'}
                      </span>
                    </TableCell>
                    <TableCell data-label="Aksi" className="sm:text-right">
                      {device.status !== 'revoked' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => onRevoke(device.id)}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RedisView({ data, cachePrefix, setCachePrefix, onClear }) {
  const keys = Array.isArray(data?.keys) ? data.keys : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          title="Redis"
          value={data?.configured ? 'Configured' : 'Off'}
          description="Status koneksi cache"
          icon={Database}
          ok={Boolean(data?.configured)}
        />
        <StatusCard
          title="Pattern"
          value={data?.pattern || '-'}
          description="Pattern pencarian key"
          icon={TerminalSquare}
        />
        <StatusCard
          title="Key Ditemukan"
          value={data?.count ?? keys.length}
          description="Dibatasi untuk keamanan UI"
          icon={ListChecks}
        />
      </div>

      <Card variant="muted" className="min-w-0">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-0">
              <Field label="Prefix Redis">
                {(a11y) => (
                  <Input
                    {...a11y}
                    name="cachePrefix"
                    value={cachePrefix}
                    onChange={(event) => setCachePrefix(event.target.value)}
                    placeholder="Prefix redis, contoh: kavana:"
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] font-mono"
                  />
                )}
              </Field>
            </div>
            <Button type="button" variant="destructive" onClick={onClear} className="shrink-0">
              <Trash2 className="h-4 w-4" />
              <span>Clear Prefix</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {keys.length === 0 ? (
        <EmptyState
          icon={Database}
          title="Tidak ada key cache"
          description="Redis aktif tapi tidak ada key yang cocok dengan pattern saat ini."
        />
      ) : (
        <Card variant="muted" className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base text-[var(--text-strong)]">Daftar Key Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Key Cache</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key}>
                    <TableCell data-label="Key Cache" className="min-w-0">
                      <span className="font-mono text-xs text-[var(--text-body)] whitespace-normal break-all">
                        {key}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PermissionMatrixView({ data }) {
  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="Permission matrix kosong"
        description="Backend belum mengirim data role dan permission."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entries.map(([role, permissions]) => (
        <Card key={role} variant="muted" className="min-w-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base text-[var(--text-strong)]">
                {normalizeLabel(role)}
              </CardTitle>
              <Badge variant="outline" className="rounded-md font-mono text-xs tabular-nums">
                {Array.isArray(permissions) ? permissions.length : 0} izin
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(permissions) ? permissions : []).map((permission) => (
                <Badge key={permission} variant="secondary" className="rounded-md font-normal">
                  {normalizeLabel(permission)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
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
      <LoadingState
        variant={mode === 'dashboard' || mode === 'health' ? 'dashboard' : 'table'}
        label={`Memuat ${MODE_LABELS[mode] || 'Developer Center'}`}
      />
    );
  }

  const isDashboard = mode === 'dashboard';
  const isSyntheticResult = Array.isArray(data?.checks);
  const healthContentData = isSyntheticResult ? data : health || data;
  let renderedContent = <HealthView data={data} />;
  if (mode === 'dashboard' || mode === 'health') {
    renderedContent = <HealthView data={healthContentData} />;
  }
  if (mode === 'audit-logs') renderedContent = <LogsView data={data} type="audit" />;
  if (mode === 'auth-logs') renderedContent = <LogsView data={data} type="auth" />;
  if (mode === 'auth-trackers') renderedContent = <AuthTrackerView data={data} />;
  if (mode === 'devices') renderedContent = <DevicesView data={data} onRevoke={revokeDevice} />;
  if (mode === 'redis-cache') {
    renderedContent = (
      <RedisView
        data={data}
        cachePrefix={cachePrefix}
        setCachePrefix={setCachePrefix}
        onClear={clearCache}
      />
    );
  }
  if (mode === 'permission-matrix') renderedContent = <PermissionMatrixView data={data} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODE_LABELS[mode] || 'Developer Center'}
        subtitle={MODE_DESCRIPTIONS[mode] || 'Panel teknis developer.'}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          {mode === 'dashboard' || mode === 'health' ? (
            <Button type="button" onClick={runSyntheticTests}>
              <Zap className="h-4 w-4" />
              <span>Run Synthetic Test</span>
            </Button>
          ) : null}
        </div>
      </PageHeader>

      {isDashboard && health ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Database"
            value={health?.db?.ok ? 'OK' : 'Issue'}
            description={`${health?.db?.latency_ms ?? '-'} ms`}
            icon={Server}
            ok={Boolean(health?.db?.ok)}
          />
          <StatusCard
            title="Redis"
            value={
              health?.redis?.configured ? (health?.redis?.ok ? 'OK' : 'Configured') : 'Off'
            }
            description="Cache dan realtime backbone"
            icon={Database}
            ok={Boolean(health?.redis?.configured)}
          />
          <StatusCard
            title="Turnstile"
            value={health?.runtime?.turnstile_enabled ? 'On' : 'Off'}
            description="Login protection"
            icon={Shield}
            ok={Boolean(health?.runtime?.turnstile_enabled)}
          />
          <StatusCard
            title="Mode"
            value={health?.runtime?.node_env || '-'}
            description="Runtime environment"
            icon={Activity}
          />
        </div>
      ) : null}

      {renderedContent}
    </div>
  );
}
