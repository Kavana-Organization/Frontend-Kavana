// ========================================
// API HELPER - Kavana Bimbingan Online
// ========================================

import { notifyRealtimeUpdate } from '@/lib/realtime';

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL
    || 'https://asia-southeast2-renzip-478811.cloudfunctions.net/kavana'
).replace(/\/$/, '');

const GET_CACHE_TTL = 30 * 1000;
const getRequestCache = new Map();
const inflightRequests = new Map();

// ========================================
// TOKEN MANAGEMENT
// ========================================

export function getToken() {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('authToken');
}

export function setToken(token) {
    sessionStorage.setItem('authToken', token);
}

export function clearToken() {
    sessionStorage.removeItem('authToken');
}

export function isLoggedIn() {
    return !!getToken();
}

function getCacheIdentity() {
    if (typeof window === 'undefined') return 'server';
    const userId = sessionStorage.getItem('userId') || 'anon';
    const role = sessionStorage.getItem('userRole') || 'public';
    return `${role}:${userId}`;
}

function buildRequestCacheKey(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const credentials = options.credentials === 'include' ? 'cookie' : 'stateless';
    return `${method}:${endpoint}:${credentials}:${getCacheIdentity()}`;
}

function clearExpiredRequestCache() {
    const currentTime = Date.now();
    for (const [key, entry] of getRequestCache.entries()) {
        if (entry.expiresAt <= currentTime) {
            getRequestCache.delete(key);
        }
    }
}

export function invalidateApiCache(prefixes = [], options = {}) {
    if (!Array.isArray(prefixes) || prefixes.length === 0) return;
    const shouldBroadcast = options.broadcast !== false;

    for (const key of getRequestCache.keys()) {
        if (prefixes.some((prefix) => key.includes(prefix))) {
            getRequestCache.delete(key);
        }
    }

    for (const key of inflightRequests.keys()) {
        if (prefixes.some((prefix) => key.includes(prefix))) {
            inflightRequests.delete(key);
        }
    }

    if (shouldBroadcast && typeof window !== 'undefined') {
        notifyRealtimeUpdate(prefixes, { source: 'api-cache-invalidated' });
    }
}

// ========================================
// BASE API REQUEST
// ========================================

/**
 * Generate a simple traceparent header for OpenTelemetry propagation.
 */
function generateTraceparent() {
    const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');
    return `00-${hex(16)}-${hex(8)}-01`;
}

export async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const method = (options.method || 'GET').toUpperCase();
    const isGetRequest = method === 'GET';
    const cacheKey = buildRequestCacheKey(endpoint, options);
    const shouldUseCache = isGetRequest && !options.skipCache;

    // Only send credentials (cookies) when explicitly needed, to avoid
    // CORS issues with backends that use wildcard Access-Control-Allow-Origin
    const needsCredentials = options.credentials === 'include';

    const config = {
        ...(needsCredentials && { credentials: 'include' }),
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(typeof crypto !== 'undefined' && crypto.getRandomValues && { traceparent: generateTraceparent() }),
            ...options.headers,
        },
        ...options,
    };

    // Remove Content-Type for FormData (let browser set it)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    clearExpiredRequestCache();

    if (shouldUseCache) {
        const cached = getRequestCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value;
        }

        if (inflightRequests.has(cacheKey)) {
            return inflightRequests.get(cacheKey);
        }
    }

    const requestPromise = (async () => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            console.error(`API Error (${endpoint}):`, data);
            // Handle new standardized error format: { error: { code, message, request_id } }
            const errorMsg = data?.error?.message || data?.message || 'Request failed';
            const errorCode = data?.error?.code || null;
            return { ok: false, error: errorMsg, code: errorCode, status: response.status };
        }

        const result = { ok: true, data };
        if (shouldUseCache) {
            getRequestCache.set(cacheKey, {
                value: result,
                expiresAt: Date.now() + (options.cacheTtl ?? GET_CACHE_TTL),
            });
        }

        return result;
    } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        return { ok: false, error: err.message || 'Network error' };
    } finally {
        if (shouldUseCache) {
            inflightRequests.delete(cacheKey);
        }
    }
    })();

    if (shouldUseCache) {
        inflightRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
}

// ========================================
// AUTH API
// ========================================

export const authAPI = {
    login: async (email, password) => {
        const result = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (result.ok && result.data.token) {
            setToken(result.data.token);
            sessionStorage.setItem('userRole', result.data.role);
            sessionStorage.setItem('userId', result.data.user_id);
        }

        return result;
    },

    register: async (data) => {
        return apiRequest('/api/auth/register/mahasiswa', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getProfile: () => apiRequest('/api/auth/profile'),

    updateProfile: (data) =>
        apiRequest('/api/auth/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/auth/profile', '/api/mahasiswa/profile', '/api/dosen/profile', '/api/kaprodi/profile', '/api/koordinator/profile']);
            return result;
        }),

    changePassword: (oldPassword, newPassword) =>
        apiRequest('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        }),

    logout: async () => {
        try {
            await apiRequest('/api/auth/logout', { method: 'POST' });
        } catch (_) { /* ignore - clear local state regardless */ }
        invalidateApiCache(['/api/']);
        clearToken();
        sessionStorage.clear();
    },

    // Session-based endpoints (Better Auth) — need credentials for cookies
    getSession: () => apiRequest('/api/auth/session', { credentials: 'include' }),
    getMe: () => apiRequest('/api/auth/me'),
    refreshSession: () => apiRequest('/api/auth/refresh', { method: 'POST', credentials: 'include' }),

    requestOTP: (email, type = 'reset_password') =>
        apiRequest('/api/auth/request-otp', {
            method: 'POST',
            body: JSON.stringify({ email, type }),
        }),

    verifyOTP: (email, otp, type = 'reset_password') =>
        apiRequest('/api/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp, type }),
        }),

    resetPassword: (reset_token, new_password) =>
        apiRequest('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ reset_token, new_password }),
        }),

    requestRegisterOTP: (data) =>
        apiRequest('/api/auth/request-register-otp', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    verifyRegisterOTP: (email, otp) =>
        apiRequest('/api/auth/verify-register-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        }),
};

// ========================================
// MAHASISWA API
// ========================================

export const mahasiswaAPI = {
    getProfile: () => apiRequest('/api/mahasiswa/profile'),

    setTrack: (track, partnerNpm = null) =>
        apiRequest('/api/mahasiswa/track', {
            method: 'PATCH',
            body: JSON.stringify({ track, partner_npm: partnerNpm }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/mahasiswa/', '/api/koordinator/', '/api/kaprodi/', '/api/notifications/stats']);
            return result;
        }),

    getProposalStatus: () => apiRequest('/api/mahasiswa/profile'),

    submitProposal: (data) =>
        apiRequest('/api/mahasiswa/proposal', {
            method: 'POST',
            body: JSON.stringify(data),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/mahasiswa/', '/api/koordinator/', '/api/kaprodi/', '/api/notifications/stats']);
            return result;
        }),

    getMyBimbingan: () => apiRequest('/api/mahasiswa/bimbingan'),

    createBimbingan: (data) =>
        apiRequest('/api/mahasiswa/bimbingan', {
            method: 'POST',
            body: JSON.stringify(data),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/mahasiswa/bimbingan', '/api/dosen/bimbingan', '/api/dosen/mahasiswa', '/api/dosen/stats', '/api/notifications/stats']);
            return result;
        }),

    submitLaporan: (data) =>
        apiRequest('/api/mahasiswa/laporan', {
            method: 'POST',
            body: JSON.stringify(data),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/mahasiswa/laporan', '/api/mahasiswa/sidang', '/api/dosen/laporan', '/api/dosen/stats', '/api/notifications/stats']);
            return result;
        }),

    createKelompok: (nama) =>
        apiRequest('/api/mahasiswa/kelompok', {
            method: 'POST',
            body: JSON.stringify({ nama }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/mahasiswa/profile', '/api/mahasiswa/kelompok', '/api/koordinator/', '/api/kaprodi/']);
            return result;
        }),

    joinKelompok: (kelompok_id) =>
        apiRequest('/api/mahasiswa/kelompok/join', {
            method: 'POST',
            body: JSON.stringify({ kelompok_id }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/mahasiswa/profile', '/api/mahasiswa/kelompok', '/api/koordinator/', '/api/kaprodi/']);
            return result;
        }),

    getMyKelompok: () => apiRequest('/api/mahasiswa/kelompok'),
    getAvailableKelompok: () => apiRequest('/api/mahasiswa/kelompok/available'),
    getPeriodeAktif: () => apiRequest('/api/mahasiswa/periode-aktif'),
    getDosenList: () => apiRequest('/api/mahasiswa/dosen/list'),
    getMyLaporan: () => apiRequest('/api/mahasiswa/laporan'),
    getMySidang: () => apiRequest('/api/mahasiswa/sidang'),
};

// ========================================
// DOSEN API
// ========================================

export const dosenAPI = {
    getProfile: () => apiRequest('/api/dosen/profile'),
    getStats: () => apiRequest('/api/dosen/stats'),
    getMahasiswaBimbingan: () => apiRequest('/api/dosen/mahasiswa'),
    getBimbinganList: () => apiRequest('/api/dosen/bimbingan'),

    approveBimbingan: (id, status, catatan) =>
        apiRequest(`/api/dosen/bimbingan/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, catatan }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/dosen/bimbingan', '/api/dosen/mahasiswa', '/api/dosen/stats', '/api/mahasiswa/bimbingan', '/api/notifications/stats']);
            return result;
        }),

    getLaporanList: () => apiRequest('/api/dosen/laporan'),

    approveLaporan: (laporanId, status, note = '') =>
        apiRequest(`/api/dosen/laporan/${laporanId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({
                status,
                ...(note ? { note } : {}),
            }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/dosen/laporan', '/api/dosen/stats', '/api/mahasiswa/laporan', '/api/koordinator/sidang', '/api/notifications/stats']);
            return result;
        }),
};

// ========================================
// KOORDINATOR API
// ========================================

export const koordinatorAPI = {
    getProfile: () => apiRequest('/api/koordinator/profile'),
    getStats: () => apiRequest('/api/koordinator/stats'),
    getPendingProposals: () => apiRequest('/api/koordinator/proposal/pending'),

    validateProposal: (mahasiswaId, status, catatan) =>
        apiRequest('/api/koordinator/proposal/validate', {
            method: 'PATCH',
            body: JSON.stringify({ mahasiswa_id: mahasiswaId, status, catatan }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/mahasiswa/', '/api/koordinator/', '/api/kaprodi/', '/api/notifications/stats']);
            return result;
        }),

    getMahasiswaList: (options = {}) => {
        const grouped = options.grouped !== false;
        return apiRequest(`/api/koordinator/mahasiswa${grouped ? '' : '?grouped=false'}`);
    },
    getDosenList: () => apiRequest('/api/koordinator/dosen'),

    assignDosen: (mahasiswaId, dosenId, dosenId2) =>
        apiRequest('/api/koordinator/assign-dosen', {
            method: 'POST',
            body: JSON.stringify({
                mahasiswa_id: mahasiswaId,
                dosen_id: dosenId,
                dosen_id_2: dosenId2 || null,
            }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/mahasiswa/', '/api/dosen/', '/api/koordinator/', '/api/kaprodi/', '/api/notifications/stats']);
            return result;
        }),

    scheduleSidang: (data) =>
        apiRequest('/api/koordinator/sidang/schedule', {
            method: 'POST',
            body: JSON.stringify(data),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/koordinator/sidang', '/api/mahasiswa/sidang']);
            return result;
        }),

    getJadwalList: () => apiRequest('/api/koordinator/jadwal'),
    getJadwalActive: () => apiRequest('/api/koordinator/jadwal/active'),

    createJadwal: (data) =>
        apiRequest('/api/koordinator/jadwal', {
            method: 'POST',
            body: JSON.stringify(data),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/koordinator/jadwal', '/api/koordinator/jadwal/active', '/api/mahasiswa/periode-aktif']);
            return result;
        }),

    updateJadwal: (id, data) =>
        apiRequest(`/api/koordinator/jadwal/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/koordinator/jadwal', '/api/koordinator/jadwal/active', '/api/mahasiswa/periode-aktif']);
            return result;
        }),

    completeJadwal: (id) =>
        apiRequest(`/api/koordinator/jadwal/${id}/complete`, {
            method: 'POST',
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/koordinator/jadwal', '/api/koordinator/jadwal/active', '/api/mahasiswa/periode-aktif']);
            return result;
        }),

    getMySemester: () => apiRequest('/api/koordinator/my-semester'),
    getAllMahasiswa: (options = {}) => {
        const grouped = options.grouped !== false;
        return apiRequest(`/api/koordinator/mahasiswa${grouped ? '' : '?grouped=false'}`);
    },
    getAllSidang: () => apiRequest('/api/koordinator/sidang'),
    getPengujiList: () => apiRequest('/api/koordinator/penguji'),
};

// ========================================
// KAPRODI API
// ========================================

export const kaprodiAPI = {
    getProfile: () => apiRequest('/api/kaprodi/profile'),
    getStats: () => apiRequest('/api/kaprodi/stats'),
    getRecentActivities: () => apiRequest('/api/kaprodi/activities'),
    getMahasiswaList: (options = {}) => {
        const grouped = options.grouped !== false;
        return apiRequest(`/api/kaprodi/mahasiswa${grouped ? '' : '?grouped=false'}`);
    },
    getDosenList: () => apiRequest('/api/kaprodi/dosen'),
    getKoordinatorList: () => apiRequest('/api/kaprodi/koordinator'),

    assignKoordinatorSemester: (koordinator_id, semesters) =>
        apiRequest('/api/kaprodi/koordinator/assign-semester', {
            method: 'POST',
            body: JSON.stringify({ koordinator_id, semesters }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/kaprodi/', '/api/koordinator/', '/api/notifications/stats']);
            return result;
        }),

    unassignKoordinatorSemester: (koordinator_id, semesters = []) =>
        apiRequest('/api/kaprodi/koordinator/unassign-semester', {
            method: 'POST',
            body: JSON.stringify({ koordinator_id, semesters }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/kaprodi/', '/api/koordinator/', '/api/notifications/stats']);
            return result;
        }),

    setMahasiswaRepeatStatus: (payload) =>
        apiRequest('/api/kaprodi/mahasiswa/repeat-status', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/kaprodi/', '/api/koordinator/', '/api/mahasiswa/', '/api/notifications/stats']);
            return result;
        }),
};

// ========================================
// ADMIN API
// ========================================

export const adminAPI = {
    getProfile: () => apiRequest('/api/admin/profile'),
    getStats: () => apiRequest('/api/admin/stats'),
    getRecentActivity: () => apiRequest('/api/admin/activity'),
    getAuditLogs: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.set(key, value);
            }
        });
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return apiRequest(`/api/admin/audit-logs${suffix}`);
    },
    getAllUsers: () => apiRequest('/api/admin/users'),

    updateUserStatus: (userId, role, isActive) =>
        apiRequest(`/api/admin/users/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ role, is_active: isActive }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/admin/users', '/api/admin/stats', '/api/admin/activity', '/api/admin/audit-logs']);
            return result;
        }),

    updateUserProfile: (userId, payload) =>
        apiRequest(`/api/admin/users/${userId}/profile`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/admin/users', '/api/admin/stats', '/api/admin/activity', '/api/admin/audit-logs']);
            return result;
        }),

    resetUserPassword: (userId, payload) =>
        apiRequest(`/api/admin/users/${userId}/password`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/admin/activity', '/api/admin/audit-logs']);
            return result;
        }),

    deleteUser: (userId, role) =>
        apiRequest(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            body: JSON.stringify({ role }),
        }).then((result) => {
            if (result.ok) invalidateApiCache(['/api/admin/users', '/api/admin/stats', '/api/admin/activity', '/api/admin/audit-logs']);
            return result;
        }),

    getAllDosen: () => apiRequest('/api/admin/dosen'),

    createDosen: (data) =>
        apiRequest('/api/admin/dosen', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getAllMahasiswa: () => apiRequest('/api/admin/mahasiswa'),
    getSystemReport: () => apiRequest('/api/admin/report'),
};

// ========================================
// NOTIFICATION API
// ========================================

export const notificationAPI = {
    getStats: async () => {
        const result = await apiRequest('/api/notifications/stats');
        if (result.ok) return result;

        // Backward-compat fallback for older backend route style.
        return apiRequest('/api/notifications');
    },
};

// ========================================
// UPLOAD API
// ========================================

export const uploadAPI = {
    uploadProfile: async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/profile/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        return { ok: response.ok, data };
    },
};
