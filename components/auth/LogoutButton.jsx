// components/auth/LogoutButton.jsx
'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <button className="text-sm underline" onClick={onLogout}>
      로그아웃
    </button>
  );
}
