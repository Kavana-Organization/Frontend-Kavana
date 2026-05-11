'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authAPI } from '@/lib/api';
import { ROLE_DASHBOARD_ROUTE } from '@/lib/constants';

export function AuthGuard({ children, allowedRoles = [] }) {
  const router = useRouter();
  const { token, role, roles, setUser } = useAuthStore();
  const sessionChecked = useRef(false);

  useEffect(() => {
    // Not authenticated
    if (!token && typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('authToken');
      if (!storedToken) {
        router.replace('/login');
        return;
      }
    }

    // Validate session with backend once per mount (non-blocking, graceful)
    if (token && !sessionChecked.current) {
      sessionChecked.current = true;
      authAPI.getMe().then((result) => {
        if (result.ok && result.data) {
          setUser(result.data);
        } else if (result.status === 401 && (result.code === 'UNAUTHORIZED' || result.code === 'SESSION_EXPIRED' || result.code === 'INVALID_TOKEN')) {
          // Session/token definitely invalid — force re-login
          useAuthStore.getState().logout();
          router.replace('/login');
        }
        // For 404 or other errors (e.g. endpoint doesn't exist yet), silently ignore
      });
    }

    // Role check (support both single role and roles array)
    if (allowedRoles.length > 0 && role) {
      const userRoles = roles?.length ? roles : [role];
      const hasAccess = userRoles.includes('developer') || allowedRoles.some(r => userRoles.includes(r));
      if (!hasAccess) {
        const redirectTo = ROLE_DASHBOARD_ROUTE[role] || '/login';
        router.replace(redirectTo);
      }
    }
  }, [token, role, roles, allowedRoles, router, setUser]);

  // Don't render until auth check is done
  if (!token && typeof window !== 'undefined' && !sessionStorage.getItem('authToken')) {
    return null;
  }

  return children;
}
