export const GOOGLE_DRIVE_LINK_PREFIX = 'https://drive.google.com/drive';

export function isValidGoogleDriveLink(value) {
  const input = String(value || '').trim();
  if (!input) return false;

  try {
    const url = new URL(input);
    return url.protocol === 'https:'
      && url.hostname === 'drive.google.com'
      && url.pathname.startsWith('/drive');
  } catch {
    return false;
  }
}

export function getGoogleDriveLinkError(value, label = 'Link') {
  return isValidGoogleDriveLink(value)
    ? ''
    : `${label} harus memakai format ${GOOGLE_DRIVE_LINK_PREFIX}...`;
}
