import MobileViewportShell from "@/components/shell/MobileViewportShell";
import MenteeBottomNav from "@/components/mentee/bottom-nav/MenteeBottomNav";
import AuthGate from '@/components/auth/AuthGate';

export default function MenteeLayout({ children }) {
  return (
    <AuthGate allowRoles={['MENTEE']}>
      <MobileViewportShell>
        <div className="min-h-dvh flex flex-col">
          <main className="flex-1">{children}</main>
          <MenteeBottomNav />
        </div>
      </MobileViewportShell>
    </AuthGate>
  );
}
