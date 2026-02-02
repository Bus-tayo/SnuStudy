// components/auth/AuthGate.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthSession, getAppUserFromSession } from '@/lib/auth/session';

export default function AuthGate({ allowRoles, children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { session } = await getAuthSession();
      const { role } = getAppUserFromSession(session);

      if (!session) {
        router.replace('/login');
        return;
      }
      if (Array.isArray(allowRoles) && allowRoles.length > 0) {
        if (!allowRoles.includes(role)) {
          router.replace('/login');
          return;
        }
      }
      if (alive) setOk(true);
    })();

    return () => {
      alive = false;
    };
  }, [router, allowRoles]);

  if (!ok) return null;
  return <>{children}</>;
}
