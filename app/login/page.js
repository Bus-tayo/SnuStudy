'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getAppUserFromSession } from '@/lib/auth/session';

const PRESET_ACCOUNTS = [
  { label: '멘티1', email: 'mentee1@gmail.com' },
  { label: '멘티2', email: 'mentee2@gmail.com' },
  { label: '멘토1', email: 'mentor1@gmail.com' },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('11111111');
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

      const { role } = getAppUserFromSession(data.session);
      router.replace(role === 'MENTOR' ? '/mentor' : '/mentee');
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-xl p-5 space-y-4">
        <h1 className="text-lg font-semibold">로그인</h1>

        {/* 이메일 입력 */}
        <div className="space-y-1">
          <label className="text-sm">이메일</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="example@snu.ac.kr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* 비밀번호 */}
        <div className="space-y-1">
          <label className="text-sm">비밀번호</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* 테스트 계정 빠른 입력 */}
        <div className="flex gap-2 text-xs">
          {PRESET_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              className="border rounded px-2 py-1"
              onClick={() => setEmail(a.email)}
            >
              {a.label}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="text-sm text-red-600">{errorMsg}</div>
        )}

        <button
          className="w-full border rounded-lg px-3 py-2"
          onClick={onLogin}
          disabled={loading}
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </div>
    </div>
  );
}
