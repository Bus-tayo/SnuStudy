'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, MessageSquare, User } from 'lucide-react';

export default function MenteeBottomNav() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: '홈', href: '/mentee', icon: Home },
    { label: '플래너', href: '/mentee/planner', icon: Calendar },
    { label: '피드백', href: '/mentee/feedback', icon: MessageSquare },
    { label: '마이', href: '/mentee/my', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-white border-t border-border/60 pb-safe">
      <div className="w-full max-w-[430px] px-4 py-2 flex items-center justify-between">
        
        {NAV_ITEMS.map((item) => {
          const isActive = 
            item.href === '/mentee' 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-5 py-2 transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground' 
              }`}
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? 'fill-current' : 'stroke-current'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}