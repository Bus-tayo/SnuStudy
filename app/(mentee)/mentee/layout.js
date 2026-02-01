import MobileViewportShell from "@/components/shell/MobileViewportShell";
import MenteeBottomNav from "@/components/mentee/bottom-nav/MenteeBottomNav";

export default function MenteeLayout({ children }) {
  return (
    <MobileViewportShell>
      <div className="min-h-dvh flex flex-col">
        <main className="flex-1">{children}</main>
        <MenteeBottomNav />
      </div>
    </MobileViewportShell>
  );
}
