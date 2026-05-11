import {
    LayoutDashboard,
    Briefcase,
    Users,
    MessageSquare,
    Upload,
    FileText,
    GraduationCap,
    User,
    Settings,
    UserCheck,
    CheckCircle,
    ClipboardCheck,
    CalendarDays,
    ListChecks,
    UserCog,
    Group,
    BarChart3,
    Shield,
    Activity,
    Code2,
    Server,
    Database,
    KeyRound,
    TerminalSquare,
} from 'lucide-react';

// ---------- MENU CONFIG ----------

export const MENU_CONFIG = {
    mahasiswa: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'track', label: 'Proyek & Internship', icon: Briefcase },
        { id: 'kelompok', label: 'Kelompok Proyek', icon: Users },
        { id: 'bimbingan', label: 'Bimbingan Online', icon: MessageSquare },
        { id: 'proposal', label: 'Upload Proposal', icon: Upload },
        { id: 'laporan', label: 'Upload Laporan Sidang', icon: FileText },
        { id: 'hasil', label: 'Nilai & Hasil Akhir', icon: GraduationCap },
        { id: 'revisi-sidang', label: 'Revisi Sidang', icon: ClipboardCheck },
        { id: 'profile', label: 'Profil Saya', icon: User },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ],
    dosen: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'mahasiswa-bimbingan', label: 'Mahasiswa Bimbingan', icon: Users },
        { id: 'bimbingan-approve', label: 'Approve Bimbingan', icon: CheckCircle },
        { id: 'laporan-approve', label: 'Approve Laporan Sidang', icon: ClipboardCheck },
        { id: 'revisi-approve', label: 'Approve Revisi Sidang', icon: ClipboardCheck },
        { id: 'profile', label: 'Profil Saya', icon: User },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ],
    penguji: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'sidang', label: 'Sidang Penguji', icon: GraduationCap },
        // Penguji tetap dosen, jadi fitur pembimbing tetap tersedia.
        { id: 'separator-dosen', label: 'Dosen Pembimbing', icon: null },
        { id: 'mahasiswa-bimbingan', label: 'Mahasiswa Bimbingan', icon: Users },
        { id: 'bimbingan-approve', label: 'Approve Bimbingan', icon: CheckCircle },
        { id: 'laporan-approve', label: 'Approve Laporan Sidang', icon: ClipboardCheck },
        { id: 'revisi-approve', label: 'Approve Revisi Sidang', icon: ClipboardCheck },
        { id: 'profile', label: 'Profil Saya', icon: User },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ],
    koordinator: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'kelola-periode', label: 'Kelola Periode', icon: CalendarDays },
        { id: 'validasi-proposal', label: 'Validasi Proposal', icon: ListChecks },
        { id: 'approve-pembimbing', label: 'Assign Pembimbing', icon: UserCheck },
        { id: 'daftar-mahasiswa', label: 'Daftar Mahasiswa', icon: Users },
        { id: 'jadwal-sidang', label: 'Jadwal Sidang', icon: CalendarDays },
        { id: 'revisi-monitoring', label: 'Monitoring Revisi', icon: BarChart3 },
        // Dosen Pembimbing features (koordinator juga dosen)
        { id: 'separator', label: 'Dosen Pembimbing', icon: null },
        { id: 'mahasiswa-bimbingan', label: 'Mahasiswa Bimbingan', icon: GraduationCap },
        { id: 'bimbingan-approve', label: 'Approve Bimbingan', icon: CheckCircle },
        { id: 'laporan-approve', label: 'Approve Laporan Sidang', icon: ClipboardCheck },
        { id: 'revisi-approve', label: 'Approve Revisi Sidang', icon: ClipboardCheck },
        { id: 'profile', label: 'Profil Saya', icon: User },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ],
    kaprodi: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'kelola-koordinator', label: 'Kelola Koordinator', icon: UserCog },
        { id: 'daftar-dosen', label: 'Daftar Dosen', icon: Group },
        { id: 'monitoring', label: 'Monitoring Mahasiswa', icon: BarChart3 },
        // Koordinator features
        { id: 'separator-koordinator', label: 'Koordinator', icon: null },
        { id: 'kelola-periode', label: 'Kelola Periode', icon: CalendarDays },
        { id: 'validasi-proposal', label: 'Validasi Proposal', icon: ListChecks },
        { id: 'approve-pembimbing', label: 'Assign Pembimbing', icon: UserCheck },
        { id: 'daftar-mahasiswa', label: 'Daftar Mahasiswa', icon: Users },
        { id: 'jadwal-sidang', label: 'Jadwal Sidang', icon: CalendarDays },
        { id: 'revisi-monitoring', label: 'Monitoring Revisi', icon: BarChart3 },
        // Dosen Pembimbing features
        { id: 'separator-dosen', label: 'Dosen Pembimbing', icon: null },
        { id: 'mahasiswa-bimbingan', label: 'Mahasiswa Bimbingan', icon: GraduationCap },
        { id: 'bimbingan-approve', label: 'Approve Bimbingan', icon: CheckCircle },
        { id: 'laporan-approve', label: 'Approve Laporan Sidang', icon: ClipboardCheck },
        { id: 'revisi-approve', label: 'Approve Revisi Sidang', icon: ClipboardCheck },
        { id: 'profile', label: 'Profil Saya', icon: User },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ],
    admin: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'kelola-users', label: 'Kelola Users', icon: Shield },
        { id: 'kelola-dosen', label: 'Kelola Dosen', icon: UserCog },
        { id: 'monitoring', label: 'Monitoring Sistem', icon: Activity },
        { id: 'settings', label: 'Pengaturan Sistem', icon: Settings },
    ],
    developer: [
        { id: 'dashboard', label: 'Developer Center', icon: Code2 },
        { id: 'health', label: 'System Health', icon: Server },
        { id: 'audit-logs', label: 'Audit Logs', icon: Activity },
        { id: 'auth-logs', label: 'Auth Logs', icon: Shield },
        { id: 'devices', label: 'Device Lock', icon: KeyRound },
        { id: 'redis-cache', label: 'Redis Cache', icon: Database },
        { id: 'permission-matrix', label: 'Permission Matrix', icon: TerminalSquare },
        { id: 'settings', label: 'Pengaturan Sistem', icon: Settings },
    ],
};

// ---------- ROLE LABELS ----------

export const ROLE_LABEL = {
    mahasiswa: 'Mahasiswa',
    dosen: 'Dosen Pembimbing',
    penguji: 'Dosen Penguji',
    koordinator: 'Koordinator',
    kaprodi: 'Kepala Prodi',
    admin: 'Administrator',
    developer: 'Developer',
};

// ---------- TITLE MAP ----------

export const TITLE_MAP = {
    dashboard: 'Ringkasan Kegiatan',
    track: 'Proyek & Internship',
    bimbingan: 'Bimbingan Online',
    proposal: 'Upload Proposal',
    laporan: 'Upload Laporan Sidang',
    hasil: 'Nilai & Hasil Akhir',
    kelompok: 'Kelompok Proyek',
    profile: 'Profil Saya',
    settings: 'Pengaturan',
    'mahasiswa-bimbingan': 'Mahasiswa Bimbingan',
    'bimbingan-approve': 'Approve Bimbingan',
    'laporan-approve': 'Approve Laporan Sidang',
    sidang: 'Sidang Penguji',
    'validasi-proposal': 'Validasi Proposal',
    'approve-pembimbing': 'Assign Pembimbing',
    'daftar-mahasiswa': 'Daftar Mahasiswa',
    'kelola-periode': 'Kelola Periode',
    'jadwal-sidang': 'Jadwal Sidang',
    'kelola-koordinator': 'Kelola Koordinator',
    'daftar-dosen': 'Daftar Dosen',
    monitoring: 'Monitoring Mahasiswa',
    'kelola-users': 'Kelola Users',
    'kelola-dosen': 'Kelola Dosen',
    'revisi-sidang': 'Revisi Sidang',
    'revisi-approve': 'Approve Revisi Sidang',
    'revisi-monitoring': 'Monitoring Revisi',
    health: 'System Health',
    'audit-logs': 'Audit Logs',
    'auth-logs': 'Auth Logs',
    devices: 'Device Lock',
    'redis-cache': 'Redis Cache',
    'permission-matrix': 'Permission Matrix',
};

// ---------- ROLE DASHBOARD ROUTES ----------

export const ROLE_DASHBOARD_ROUTE = {
    mahasiswa: '/dashboard/mahasiswa',
    dosen: '/dashboard/dosen',
    penguji: '/dashboard/penguji',
    koordinator: '/dashboard/koordinator',
    kaprodi: '/dashboard/kaprodi',
    admin: '/dashboard/admin',
    developer: '/dashboard/developer',
};

// ---------- LANDING CONTENT ----------

export const LANDING_CONTENT = {
    brand: {
        name: 'Kavana',
        subtitle: 'Sistem Bimbingan Online',
    },
    nav: [
        { label: 'Beranda', href: '#top' },
        { label: 'Fitur', href: '#features' },
        { label: 'Peran', href: '#roles' },
        { label: 'Alur', href: '#how' },
        { label: 'Kontak', href: '#contact' },
    ],
    hero: {
        badge: 'Portal Akademik Program Studi D4TI ULBI',
        title: 'Bimbingan Akademik Lebih Tertata dan Transparan',
        description:
            'Platform terintegrasi untuk mahasiswa, dosen pembimbing, dan pengelola prodi D4 Teknik Informatika ULBI dalam proses proyek, internship, dan administrasi bimbingan.',
        primaryCta: { label: 'Daftar Akun', href: '/register' },
        secondaryCta: { label: 'Masuk Sistem', href: '/login' },
    },
    stats: [
        { value: 'Data Resmi', label: 'Statistik pengguna akan dipublikasikan' },
        { value: 'Sedang Validasi', label: 'Informasi operasional sedang diverifikasi' },
        { value: 'Diperbarui Berkala', label: 'Konten akan diperbarui oleh pengelola prodi' },
    ],
    about: {
        title: 'Mengapa Menggunakan Kavana?',
        description:
            'Kavana membantu proses bimbingan berjalan lebih terstruktur melalui komunikasi terdokumentasi, alur pengajuan yang jelas, dan pemantauan progress lintas peran.',
        bullets: [
            'Riwayat bimbingan terdokumentasi dalam satu platform.',
            'Pengelolaan dokumen akademik lebih rapi dan mudah dipantau.',
            'Koordinasi antara mahasiswa, dosen, dan pengelola lebih cepat.',
        ],
    },
    features: [
        {
            num: '01',
            title: 'Manajemen Proposal',
            desc: 'Pengajuan proposal dilakukan secara digital dengan status yang dapat dipantau.',
            color: 'from-primary to-blue-700',
        },
        {
            num: '02',
            title: 'Bimbingan Online',
            desc: 'Pencatatan sesi bimbingan dan persetujuan dosen dalam satu alur kerja.',
            color: 'from-emerald-600 to-teal-700',
        },
        {
            num: '03',
            title: 'Monitoring Progres',
            desc: 'Koordinator dan kaprodi dapat memantau progres mahasiswa secara terpusat.',
            color: 'from-amber-600 to-orange-700',
        },
        {
            num: '04',
            title: 'Jadwal Terstruktur',
            desc: 'Penjadwalan sidang dan tindak lanjut bimbingan lebih terorganisir.',
            color: 'from-cyan-700 to-blue-800',
        },
    ],
    roles: [
        {
            letter: 'M',
            title: 'Mahasiswa',
            desc: 'Mengelola proposal, progres, dokumen, dan komunikasi bimbingan.',
            gradient: 'from-primary to-blue-700',
        },
        {
            letter: 'D',
            title: 'Dosen Pembimbing',
            desc: 'Memberikan arahan, review, dan persetujuan bimbingan mahasiswa.',
            gradient: 'from-emerald-600 to-teal-700',
        },
        {
            letter: 'K',
            title: 'Koordinator',
            desc: 'Memvalidasi alur akademik dan mengelola koordinasi lintas pengguna.',
            gradient: 'from-cyan-700 to-blue-800',
        },
        {
            letter: 'P',
            title: 'Kaprodi',
            desc: 'Melakukan monitoring strategis dan pengendalian proses pada level prodi.',
            gradient: 'from-slate-700 to-slate-900',
        },
    ],
    steps: [
        { num: 1, title: 'Registrasi', desc: 'Pengguna membuat akun sesuai peran akademik.' },
        { num: 2, title: 'Pilih Track', desc: 'Mahasiswa menentukan jalur proyek atau internship.' },
        { num: 3, title: 'Pengajuan', desc: 'Proposal diajukan dan divalidasi oleh pengelola.' },
        { num: 4, title: 'Bimbingan', desc: 'Sesi bimbingan berjalan dan tercatat terstruktur.' },
        { num: 5, title: 'Finalisasi', desc: 'Dokumen akhir dan tahapan sidang diproses di sistem.' },
    ],
    cta: {
        title: 'Mulai Gunakan Portal Prodi',
        description:
            'Akses sistem untuk mendukung proses bimbingan yang lebih rapi, terdokumentasi, dan akuntabel.',
        button: { label: 'Buka Halaman Masuk', href: '/login' },
    },
    footer: {
        platformLinks: [
            { label: 'Portal Mahasiswa', href: '/login' },
            { label: 'Dashboard Dosen', href: '/login' },
            { label: 'Panel Koordinator', href: '/login' },
            { label: 'Panel Kaprodi', href: '/login' },
        ],
        resourceLinks: [
            { label: 'Luaran Proyek 1', href: '/luaran-proyek-1' },
            { label: 'Luaran Proyek 2', href: '/luaran-proyek-2' },
            { label: 'Luaran Proyek 3', href: '/luaran-proyek-3' },
            { label: 'Panduan Pengguna', href: '/panduan-pengguna' },
            { label: 'FAQ Sistem', href: '/faq-sistem' },
            { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
            { label: 'Syarat Layanan', href: '/syarat-layanan' },
        ],
        copyright: 'Copyright 2026 Kavana Bimbingan Online.',
    },
};

export const PROJECT_OUTPUTS = {
    project1: {
        label: 'Proyek 1',
        title: 'Luaran Proyek 1',
        summary:
            'Tahap awal difokuskan pada aplikasi implementor yang sudah bisa dipresentasikan ke publik, dengan landing page yang jelas dan alur aplikasi inti yang cukup untuk menunjukkan nilai produk.',
        deliverables: [
            {
                title: 'Aplikasi Implementor',
                status: 'Siap Demo',
                description:
                    'Landing page publik, autentikasi, dan dashboard berbasis peran sudah tersedia untuk memperlihatkan bentuk aplikasi secara utuh.',
            },
            {
                title: 'CRUD sebagai Nilai Tambah',
                status: 'Dapat Ditinjau',
                description:
                    'Beberapa alur data seperti profil, track, proposal, bimbingan, dan kelompok dapat diperiksa langsung oleh dosen sebagai nilai tambah, tanpa dijadikan fokus klaim utama proyek 1.',
            },
            {
                title: 'Draft Buku',
                status: 'Siap Disusun',
                description:
                    'Narasi produk, alur pengguna, dan struktur fitur pada aplikasi sudah cukup matang untuk diturunkan menjadi draft buku proyek.',
            },
            {
                title: 'Poster',
                status: 'Siap Turunkan',
                description:
                    'Pesan utama produk, manfaat, dan diferensiasi aplikasi sudah bisa diringkas menjadi materi poster presentasi proyek 1.',
            },
        ],
        implementedScope: [
            'Landing page publik untuk memperkenalkan Kavana.',
            'Login, register, OTP email, dan reset password.',
            'Dashboard berbeda untuk mahasiswa, dosen, koordinator, kaprodi, dan admin.',
            'Alur akademik inti seperti track, proposal, bimbingan, laporan, dan monitoring.',
        ],
        academicNotes: [
            'Komponen CRUD diposisikan sebagai nilai tambah yang dapat diperiksa langsung oleh dosen saat presentasi atau review.',
            'Draft buku dan poster tetap perlu finalisasi isi akademik di luar codebase.',
            'Halaman ini berfungsi sebagai representasi resmi luaran Proyek 1 di aplikasi.',
        ],
    },
    project2: {
        label: 'Proyek 2',
        title: 'Luaran Proyek 2',
        summary:
            'Tahap kedua difokuskan pada aplikasi berbasis CRUD RDBMS yang terukur, terdokumentasi, dan memiliki artefak akademik lengkap berupa draft jurnal, laporan metodologi riset, dan poster.',
        deliverables: [
            {
                title: 'Aplikasi Code Coverage (CRUD RDBMS)',
                status: 'Wajib Ditunjukkan',
                description:
                    'Aplikasi harus memperlihatkan operasi Create, Read, Update, Delete pada basis data relasional, dilengkapi struktur data yang jelas dan cakupan kode yang dapat ditinjau.',
            },
            {
                title: 'Draft Jurnal',
                status: 'Siap Review',
                description:
                    'Draft jurnal memuat latar belakang, rumusan masalah, metode, implementasi, hasil pengujian, dan pembahasan singkat sesuai topik proyek.',
            },
            {
                title: 'Laporan dengan Methodologi Riset',
                status: 'Dokumen Utama',
                description:
                    'Laporan disusun menggunakan metodologi riset yang eksplisit, mulai dari pendekatan penelitian, tahapan pengembangan, pengujian, sampai evaluasi hasil.',
            },
            {
                title: 'Poster',
                status: 'Siap Presentasi',
                description:
                    'Poster merangkum masalah, tujuan, metode, fitur utama CRUD RDBMS, hasil implementasi, dan kesimpulan dalam format presentasi akademik.',
            },
        ],
        implementedScope: [
            'Aplikasi CRUD dengan RDBMS sebagai fokus utama implementasi.',
            'Model data, relasi tabel, dan alur transaksi data dapat dijelaskan saat review.',
            'Code coverage atau bukti cakupan implementasi disiapkan sebagai bagian evaluasi teknis.',
            'Dokumen akademik terdiri dari draft jurnal, laporan metodologi riset, dan poster.',
        ],
        academicNotes: [
            'CRUD RDBMS menjadi bukti utama kemampuan implementasi dan pengelolaan data pada Proyek 2.',
            'Draft jurnal dan laporan harus konsisten pada topik, metode, data uji, serta hasil evaluasi.',
            'Poster digunakan sebagai ringkasan visual untuk sidang atau presentasi luaran Proyek 2.',
        ],
    },
    project3: {
        label: 'Proyek 3',
        title: 'Luaran Proyek 3',
        summary:
            'Tahap ketiga difokuskan pada aplikasi web services yang memiliki dokumentasi API jelas, didukung draft jurnal, buku tutorial, dan poster sebagai artefak publikasi serta diseminasi hasil.',
        deliverables: [
            {
                title: 'Aplikasi Web Services (Doc API)',
                status: 'Wajib Ditunjukkan',
                description:
                    'Aplikasi harus menyediakan layanan API yang dapat diakses, diuji, dan didokumentasikan secara jelas melalui dokumentasi endpoint, request, response, autentikasi, serta skenario penggunaan.',
            },
            {
                title: 'Draft Jurnal',
                status: 'Siap Review',
                description:
                    'Draft jurnal menjelaskan latar belakang, metode pengembangan web services, rancangan API, hasil implementasi, pengujian, dan pembahasan manfaat layanan.',
            },
            {
                title: 'Buku Tutorial',
                status: 'Bebas Penerbit',
                description:
                    'Buku tutorial berisi panduan penggunaan atau implementasi aplikasi web services dan bebas memilih penerbit sesuai ketentuan akademik yang berlaku.',
            },
            {
                title: 'Poster',
                status: 'Siap Presentasi',
                description:
                    'Poster merangkum konsep layanan, arsitektur web services, fitur API utama, hasil pengujian, dan kesimpulan proyek dalam format visual akademik.',
            },
        ],
        implementedScope: [
            'Aplikasi web services menjadi fokus utama implementasi Proyek 3.',
            'Dokumentasi API mencakup endpoint, parameter, request body, response, dan status error.',
            'Pengujian API disiapkan untuk membuktikan layanan berjalan sesuai kebutuhan.',
            'Artefak akademik terdiri dari draft jurnal, buku tutorial, dan poster.',
        ],
        academicNotes: [
            'Doc API menjadi bukti utama bahwa web services dapat dipahami dan digunakan oleh pihak lain.',
            'Buku tutorial boleh menggunakan penerbit yang dipilih mahasiswa selama format dan isi tetap dapat dipertanggungjawabkan.',
            'Draft jurnal dan poster harus konsisten dengan implementasi web services yang dibuat.',
        ],
    },
};

export const CAMPUS_CONTACT = {
    address: 'Jl. Sariasih No.54, Sarijadi, Kec. Sukasari, Kota Bandung, Jawa Barat 40151',
    phone: '+62 851 7993 5117',
    email: 'support@kavana.my.id',
    officeHours: 'Senin - Jumat, 08.00 - 16.00 WIB',
};

export const SOCIAL_PROOF_CONFIG = {
    showStatistics: false,
    showTestimonial: false,
    notice: 'Data statistik dan testimoni dipublikasikan setelah validasi resmi dari program studi.',
};
