'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LogoutButton({ className = '', children = '로그아웃' }) {
  const router = useRouter();

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ss_user_id');
        localStorage.removeItem('ss_role');
        localStorage.removeItem('ss_mentor_id');
        localStorage.removeItem('ss_name');
      }
      router.replace('/login');
    }
  };

  return (
    <button onClick={onLogout} className={className}>
      {children}
    </button>
  );
}
