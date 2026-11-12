/**
 * Maps system status keys to semantic tones.
 * Tone options: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 */
export const STATUS_TONE = {
  approved: 'success',
  disetujui: 'success',
  active: 'success',
  lulus: 'success',
  waiting: 'warning',
  pending: 'warning',
  menunggu: 'warning',
  lulus_revisi: 'warning',
  rejected: 'danger',
  ditolak: 'danger',
  revoked: 'danger',
  tidak_lulus: 'danger',
  terjadwal: 'info',
};

export const DEFAULT_STATUS_LABELS = {
  approved: 'Disetujui',
  disetujui: 'Disetujui',
  active: 'Aktif',
  lulus: 'Lulus',
  waiting: 'Menunggu',
  pending: 'Menunggu',
  menunggu: 'Menunggu',
  lulus_revisi: 'Lulus Revisi',
  rejected: 'Ditolak',
  ditolak: 'Ditolak',
  revoked: 'Dicabut',
  tidak_lulus: 'Tidak Lulus',
  terjadwal: 'Terjadwal',
};

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
