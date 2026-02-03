'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { resolveAppUserFromSession, persistAppUserToStorage } from '@/lib/auth/session';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const session = data?.session;
      if (!session) throw new Error('No session after login.');

      // ✅ 핵심: auth uuid -> public.users resolve
      const appUser = await resolveAppUserFromSession(session);

      // ✅ storage 보정 세팅
      persistAppUserToStorage(appUser);

      // role 기반 라우팅
      router.replace(appUser.role === 'MENTOR' ? '/mentor' : '/mentee');
    } catch (e) {
      console.error('[LOGIN]', e);
      setErrorMsg(e?.message ?? '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto flex flex-col gap-3">
      <div className="text-lg font-semibold">로그인</div>

      <input
        className="border rounded p-2 text-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        autoComplete="email"
      />

      <input
        className="border rounded p-2 text-sm"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        type="password"
        autoComplete="current-password"
      />

      {errorMsg ? <div className="text-sm text-red-600">{errorMsg}</div> : null}

      <button
        className="border rounded p-2 text-sm"
        onClick={onLogin}
        disabled={loading}
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </div>
  );
}
