import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Normalisasi flag aktif/nonaktif dari API: MySQL mengirim 1/0 (number),
// sebagian endpoint mengirim boolean. Jangan pakai `=== false` langsung.
export function isActiveFlag(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'nonaktif', 'inactive', 'off', 'revoked'].includes(normalized)) {
    return false;
  }
  return true;
}
