'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthSession, resolveAppUserFromSession, persistAppUserToStorage } from '@/lib/auth/session';

export default function AuthGate({ allowRoles = null, children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { session } = await getAuthSession();
        if (!session) {
          router.replace('/login');
          return;
        }

        const appUser = await resolveAppUserFromSession(session);

        // ✅ 핵심: 매번 통과 시 storage를 보정 세팅 (재발 방지)
        persistAppUserToStorage(appUser);

        if (Array.isArray(allowRoles) && allowRoles.length > 0) {
          if (!allowRoles.includes(appUser.role)) {
            router.replace('/login');
            return;
          }
        }

        if (alive) setOk(true);
      } catch (e) {
        console.error('[AuthGate]', e);
        setErr(e?.message ?? 'AuthGate error');
        router.replace('/login');
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, allowRoles]);

  if (err) {
    return (
      <div className="p-4 text-sm text-red-600">
        {err}
      </div>
    );
  }

  if (!ok) return null;
  return children;
}
