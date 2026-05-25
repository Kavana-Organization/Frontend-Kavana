require('dotenv').config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kavana.my.id';
const BACKEND_URL =
  process.env.BACKEND_URL ||
  'https://asia-southeast2-renzip-478811.cloudfunctions.net/kavana';

const PLACEHOLDER_EMAILS = new Set([
  'mahasiswa.test@example.com',
  'dosen.test@example.com',
  'koordinator.test@example.com',
  'kaprodi.test@example.com',
  'admin.test@example.com',
]);

function isRealCredential(email, password) {
  return Boolean(email && password && !PLACEHOLDER_EMAILS.has(email));
}

const TEST_USERS = {
  mahasiswa: {
    email: process.env.TEST_MAHASISWA_EMAIL,
    password: process.env.TEST_MAHASISWA_PASSWORD,
  },
  dosen: {
    email: process.env.TEST_DOSEN_EMAIL,
    password: process.env.TEST_DOSEN_PASSWORD,
  },
  koordinator: {
    email: process.env.TEST_KOORDINATOR_EMAIL,
    password: process.env.TEST_KOORDINATOR_PASSWORD,
  },
  kaprodi: {
    email: process.env.TEST_KAPRODI_EMAIL,
    password: process.env.TEST_KAPRODI_PASSWORD,
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
  },
  developer: {
    email: process.env.TEST_DEVELOPER_EMAIL,
    password: process.env.TEST_DEVELOPER_PASSWORD,
    device_id: process.env.TEST_DEVELOPER_DEVICE_ID,
    device_token: process.env.TEST_DEVELOPER_DEVICE_TOKEN,
  },
};

// All dosen accounts for comprehensive testing
const ALL_DOSEN = [
  { name: 'Pak Yusril', email: 'yusrilhelmi@ulbi.ac.id', password: 'bagas7474' },
  { name: 'Pak Rolly', email: 'awangga@ulbi.ac.id', password: 'bagas7474' },
  { name: 'Pak Roni', email: 'roniandarsyah@ulbi.ac.id', password: 'bagas7474' },
  { name: 'Pak Kamal', email: 'm.nurkamal.f@ulbi.ac.id', password: 'bagas7474' },
  { name: 'Pak Cahyo', email: 'cahyo@ulbi.ac.id', password: 'bagas7474' },
  { name: 'Pak Fahri', email: 'syafrial.fachri@ulbi.ac.id', password: 'bagas7474' },
  { name: 'Pak Ronhab', email: 'roni.habibi@ulbi.ac.id', password: 'bagas7474' },
  { name: 'Bu Nisa', email: 'nisa@ulbi.ac.id', password: 'bagas7474' },
  { name: 'Miss Nur', email: 'nurainisf@ulbi.ac.id', password: 'bagas7474' },
];

function hasRoleCredential(role) {
  const user = TEST_USERS[role];
  return isRealCredential(user?.email, user?.password);
}

module.exports = {
  FRONTEND_URL,
  BACKEND_URL,
  TEST_USERS,
  ALL_DOSEN,
  hasRoleCredential,
  isRealCredential,
};
