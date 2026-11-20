/**
 * Maps system status keys to semantic tones.
 * Tone options: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 */
export const STATUS_TONE = {
  approved: 'success',
  acc: 'success',
  disetujui: 'success',
  active: 'success',
  lulus: 'success',
  completed: 'success',
  selesai: 'success',
  waiting: 'warning',
  pending: 'warning',
  menunggu: 'warning',
  submitted: 'warning',
  revisi: 'warning',
  needs_revision: 'warning',
  lulus_revisi: 'warning',
  rejected: 'danger',
  ditolak: 'danger',
  revoked: 'danger',
  tidak_lulus: 'danger',
  terjadwal: 'info',
};

/**
 * Canonical status glossary per PRD v1.2 §5 & §8:
 * Menunggu | Revisi | ACC | Ditolak | Selesai
 */
export const DEFAULT_STATUS_LABELS = {
  approved: 'ACC',
  acc: 'ACC',
  disetujui: 'ACC',
  active: 'Aktif',
  lulus: 'Selesai',
  completed: 'Selesai',
  selesai: 'Selesai',
  waiting: 'Menunggu',
  pending: 'Menunggu',
  menunggu: 'Menunggu',
  submitted: 'Menunggu',
  revisi: 'Revisi',
  needs_revision: 'Revisi',
  lulus_revisi: 'Revisi',
  rejected: 'Ditolak',
  ditolak: 'Ditolak',
  revoked: 'Dicabut',
  tidak_lulus: 'Ditolak',
  terjadwal: 'Terjadwal',
};

const ID_SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Formats a date or ISO timestamp to PRD v1.2 §5 standard:
 * "16 Nov 2026" (or "16 Nov 2026, 09:30 WIB" when withTime is true) in Asia/Jakarta (WIB).
 *
 * @param {string|number|Date} value
 * @param {{ withTime?: boolean }} [opts]
 * @returns {string}
 */
export function formatAcademicDate(value, { withTime = false } = {}) {
  if (!value) return '-';
  const raw = String(value).trim();
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch && !withTime) {
    const year = Number(dateOnlyMatch[1]);
    const monthIdx = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${ID_SHORT_MONTHS[monthIdx]} ${year}`;
    }
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10) || '-';

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    }).formatToParts(parsed);

    const map = {};
    for (const part of parts) {
      map[part.type] = part.value;
    }
    const day = Number(map.day);
    const monthIdx = Number(map.month) - 1;
    const year = map.year;
    const datePart = `${day} ${ID_SHORT_MONTHS[monthIdx] || map.month} ${year}`;

    if (withTime && map.hour && map.minute) {
      return `${datePart}, ${map.hour}:${map.minute} WIB`;
    }
    return datePart;
  } catch {
    const day = parsed.getDate();
    const month = ID_SHORT_MONTHS[parsed.getMonth()] || '';
    const year = parsed.getFullYear();
    return `${day} ${month} ${year}`;
  }
}

/**
 * Normalizes input status and returns the associated tone.
 * Unknown or missing statuses default to 'neutral'.
 *
 * @param {string} status
 * @returns {'success' | 'warning' | 'danger' | 'info' | 'neutral'}
 */
export function getStatusTone(status) {
  const normalized = String(status ?? '').trim().toLowerCase();
  return STATUS_TONE[normalized] ?? 'neutral';
}

export const resolveStatusTone = getStatusTone;
