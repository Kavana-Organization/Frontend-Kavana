const routeMap = {
  mahasiswa: '/dashboard/mahasiswa',
  dosen: '/dashboard/dosen',
  koordinator: '/dashboard/koordinator',
  kaprodi: '/dashboard/kaprodi',
  admin: '/dashboard/admin',
};

const academicRoutes = {
  track: '/dashboard/mahasiswa/track',
  kelompok: '/dashboard/mahasiswa/kelompok',
  proposal: '/dashboard/mahasiswa/proposal',
  bimbingan: '/dashboard/mahasiswa/bimbingan',
  laporan: '/dashboard/mahasiswa/laporan',
  hasil: '/dashboard/mahasiswa/hasil',
  revisi: '/dashboard/mahasiswa/revisi-sidang',
  validasiProposal: '/dashboard/koordinator/validasi-proposal',
  assignPembimbing: '/dashboard/koordinator/approve-pembimbing',
  jadwalSidang: '/dashboard/koordinator/jadwal-sidang',
};

module.exports = {
  routeMap,
  academicRoutes,
};
