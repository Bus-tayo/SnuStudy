// app/mentor/page.js
import AuthGate from '@/components/auth/AuthGate';
import LogoutButton from '@/components/auth/LogoutButton';

export default function MentorHomePage() {
  return (
    <AuthGate allowRoles={['MENTOR']}>
      <div className="min-h-screen p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">멘토 홈(임시)</h1>
          <LogoutButton />
        </div>
        <p className="mt-4 text-sm text-gray-600">
          여기에 “담당 멘티 목록”부터 붙이면 됨.
        </p>
      </div>
    </AuthGate>
  );
}
